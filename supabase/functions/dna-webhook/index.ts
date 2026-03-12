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

// ─── Normalise payload: accept both Hub and DNA app field names ───
function normalisePayload(body: Record<string, unknown>) {
  return {
    assessment_id: (body.assessment_id ?? body.assessmentId ?? null) as string | null,
    candidate_email: (body.candidate_email ?? body.candidateEmail ?? null) as string | null,
    candidate_name: (body.candidate_name ?? body.candidateName ?? null) as string | null,
    archetype: (body.archetype ?? body.tribe_viral_archetype ?? null) as string | null,
    dimension_scores: (body.dimension_scores ?? body.tribe_viral_scores ?? null) as Record<string, number> | null,
    sector_matches: (body.sectorMatches ?? body.sector_matches ?? null) as string[] | null,
    geography_matches: (body.geographyMatches ?? body.geography_matches ?? null) as string[] | null,
    department_matches: (body.departmentMatches ?? body.department_matches ?? null) as string[] | null,
  };
}

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

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const payload = normalisePayload(rawBody);

  // Validate required fields
  if (!payload.candidate_email || !payload.archetype || !payload.dimension_scores) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        required: ["candidate_email OR candidateEmail", "archetype OR tribe_viral_archetype", "dimension_scores OR tribe_viral_scores"],
        received_keys: Object.keys(rawBody),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate archetype value
  const validArchetypes = ["lion", "whale", "falcon"];
  if (!validArchetypes.includes(payload.archetype.toLowerCase())) {
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
      .eq("email", payload.candidate_email)
      .maybeSingle();

    if (findError) throw findError;

    if (!candidate) {
      await supabase.from("audit_log").insert({
        event_type: "dna_webhook_received",
        payload: { ...payload, status: "candidate_not_found" },
      });

      return new Response(
        JSON.stringify({ error: "Candidate not found", candidate_email: payload.candidate_email }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update candidate record
    const { error: updateCandidateError } = await supabase
      .from("candidates")
      .update({ prescreening_complete: true })
      .eq("id", candidate.id);

    if (updateCandidateError) throw updateCandidateError;

    // Upsert prescreening_data with all available fields
    const prescreeningRecord: Record<string, unknown> = {
      candidate_id: candidate.id,
      organization_id: candidate.organization_id,
      tribe_viral_archetype: payload.archetype.toLowerCase(),
      tribe_viral_scores: payload.dimension_scores,
      dimension_scores: payload.dimension_scores,
      sector_matches: payload.sector_matches,
      geography_matches: payload.geography_matches,
      department_matches: payload.department_matches,
      completed_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("prescreening_data")
      .upsert(prescreeningRecord, { onConflict: "candidate_id" });

    if (upsertError) throw upsertError;

    // ─── AUTO-CREATE JOURNEY BLUEPRINT ───────────────────────
    let journeyId: string | null = null;

    if (candidate.organization_id) {
      const { data: existingJourney } = await supabase
        .from("journey_blueprints")
        .select("id")
        .eq("candidate_id", candidate.id)
        .eq("organization_id", candidate.organization_id)
        .maybeSingle();

      if (!existingJourney) {
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
        }
      }
    }

    // Log success
    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_received",
      payload: {
        candidate_id: candidate.id,
        candidate_email: payload.candidate_email,
        archetype: payload.archetype,
        journey_id: journeyId,
        sector_matches: payload.sector_matches,
        geography_matches: payload.geography_matches,
        department_matches: payload.department_matches,
        status: "success",
      },
    });

    return new Response(
      JSON.stringify({ success: true, candidate_id: candidate.id, journey_id: journeyId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_received",
      payload: { candidate_email: payload.candidate_email, archetype: payload.archetype, status: "error", error: String(err) },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
