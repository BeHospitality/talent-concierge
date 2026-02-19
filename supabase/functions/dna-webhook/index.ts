import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { addDays } from "https://esm.sh/date-fns@3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Journey Template (screening phase only for auto-creation) ───
const SCREENING_TEMPLATE = [
  {
    phase: "screening",
    event_type: "auto",
    title: "DNA profile received",
    description: "Candidate completed DNA assessment. Archetype, scores, and matching data available.",
    day_offset: 0,
    assigned_to: "system",
    priority: "normal",
  },
  {
    phase: "screening",
    event_type: "task",
    title: "Review DNA profile",
    description: "Review candidate archetype, dimension scores, sector match, and department fit. Check placement risk.",
    day_offset: 0,
    assigned_to: "manager",
    priority: "high",
  },
  {
    phase: "screening",
    event_type: "task",
    title: "Check buddy compatibility",
    description: "Review suggested buddy matches. Consider archetype balance and department alignment.",
    day_offset: 1,
    assigned_to: "manager",
    priority: "normal",
  },
  {
    phase: "screening",
    event_type: "milestone",
    title: "Decision: Proceed to interview or decline",
    description: "Based on DNA profile, placement risk, and team composition — invite to interview or pass.",
    day_offset: 3,
    assigned_to: "manager",
    priority: "high",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { assessment_id, candidate_email, archetype, dimension_scores } = body as {
    assessment_id?: string;
    candidate_email?: string;
    archetype?: string;
    dimension_scores?: Record<string, number>;
  };

  // Validate required fields
  if (!assessment_id || !candidate_email || !archetype || !dimension_scores) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        required: ["assessment_id", "candidate_email", "archetype", "dimension_scores"],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate archetype value
  const validArchetypes = ["lion", "whale", "falcon"];
  if (!validArchetypes.includes(archetype.toLowerCase())) {
    return new Response(
      JSON.stringify({ error: `Invalid archetype. Must be one of: ${validArchetypes.join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Find candidate by email
    const { data: candidate, error: findError } = await supabase
      .from("candidates")
      .select("id, full_name, organization_id")
      .eq("email", candidate_email)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!candidate) {
      // Log failed attempt
      await supabase.from("audit_log").insert({
        event_type: "dna_webhook_received",
        payload: { assessment_id, candidate_email, archetype, status: "candidate_not_found" },
      });

      return new Response(
        JSON.stringify({ error: "Candidate not found", candidate_email }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update candidate
    const { error: updateCandidateError } = await supabase
      .from("candidates")
      .update({ prescreening_complete: true })
      .eq("id", candidate.id);

    if (updateCandidateError) throw updateCandidateError;

    // Upsert prescreening_data
    const { error: upsertError } = await supabase
      .from("prescreening_data")
      .upsert(
        {
          candidate_id: candidate.id,
          tribe_viral_archetype: archetype.toLowerCase(),
          tribe_viral_scores: dimension_scores,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "candidate_id" }
      );

    if (upsertError) throw upsertError;

    // ─── AUTO-CREATE JOURNEY BLUEPRINT ───────────────────────
    let journeyId: string | null = null;

    if (candidate.organization_id) {
      // Check if a journey already exists for this candidate + org
      const { data: existingJourney } = await supabase
        .from("journey_blueprints")
        .select("id")
        .eq("candidate_id", candidate.id)
        .eq("organization_id", candidate.organization_id)
        .maybeSingle();

      if (!existingJourney) {
        // Create new journey blueprint
        const { data: journey, error: journeyError } = await supabase
          .from("journey_blueprints")
          .insert({
            organization_id: candidate.organization_id,
            candidate_id: candidate.id,
            status: "active",
            current_phase: "screening",
          })
          .select()
          .single();

        if (!journeyError && journey) {
          journeyId = journey.id;

          // Generate screening phase events
          const now = new Date();
          const screeningEvents = SCREENING_TEMPLATE.map((t) => ({
            journey_id: journey.id,
            organization_id: candidate.organization_id,
            phase: t.phase,
            event_type: t.event_type,
            title: t.title,
            description: t.description,
            day_offset: t.day_offset,
            scheduled_for:
              t.day_offset !== null
                ? addDays(now, t.day_offset).toISOString()
                : null,
            status: t.day_offset === 0 ? "active" : "pending",
            assigned_to: t.assigned_to,
            priority: t.priority,
          }));

          await supabase.from("journey_events").insert(screeningEvents);

          // Create in-app notification for journey start
          // Use a team member from this org as the notification target
          const { data: teamMembers } = await supabase
            .from("team_members")
            .select("id")
            .eq("organization_id", candidate.organization_id)
            .limit(1);

          if (teamMembers && teamMembers.length > 0) {
            await supabase.from("notifications").insert({
              user_id: teamMembers[0].id,
              type: "journey_started",
              title: "New candidate journey started",
              message: `${candidate.full_name}'s DNA profile has arrived. Journey blueprint activated.`,
              link: `/candidates/${candidate.id}`,
              read: false,
            });
          }
        } else {
          console.error("Failed to create journey:", journeyError);
        }
      }
    }

    // Log success
    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_received",
      payload: {
        assessment_id,
        candidate_email,
        candidate_id: candidate.id,
        archetype,
        dimension_scores,
        journey_id: journeyId,
        status: "success",
      },
    });

    return new Response(
      JSON.stringify({ success: true, candidate_id: candidate.id, journey_id: journeyId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Log error
    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_received",
      payload: { assessment_id, candidate_email, archetype, status: "error", error: String(err) },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
