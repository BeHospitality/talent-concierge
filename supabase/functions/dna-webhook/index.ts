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
  // Support new DNA app format (email, archetype, scores, matching_results, path, etc.)
  // AND legacy Hub format (candidate_email, tribe_viral_archetype, dimension_scores, etc.)
  const email = (body.email ?? body.candidate_email ?? body.candidateEmail ?? null) as string | null;
  const candidateName = (body.candidate_name ?? body.candidateName ?? null) as string | null;

  // Archetype: new format uses "archetype", legacy uses "tribe_viral_archetype"
  const archetype = (body.archetype ?? body.tribe_viral_archetype ?? null) as string | null;
  const archetypeType = (body.archetype_type ?? null) as string | null;

  // Scores: new format uses "scores", legacy uses "dimension_scores" / "tribe_viral_scores"
  const scores = (body.scores ?? body.dimension_scores ?? body.tribe_viral_scores ?? null) as Record<string, number> | null;

  // Matching results: new format bundles into matching_results object
  const matchingResults = (body.matching_results ?? null) as Record<string, unknown> | null;
  const sectorMatches = (body.sectorMatches ?? body.sector_matches ?? (matchingResults as any)?.sectors ?? null) as string[] | null;
  const geographyMatches = (body.geographyMatches ?? body.geography_matches ?? (matchingResults as any)?.geographies ?? null) as string[] | null;
  const departmentMatches = (body.departmentMatches ?? body.department_matches ?? (matchingResults as any)?.departments ?? null) as string[] | null;

  // New DNA app fields
  const path = (body.path ?? null) as string | null;
  const sessionId = (body.session_id ?? null) as string | null;
  const source = (body.source ?? null) as string | null;
  const completedAt = (body.completed_at ?? null) as string | null;

  // Map path to candidate tier
  const tierMap: Record<string, string> = {
    starting: "Starting Out",
    growing: "Growing",
    returning: "Returning",
    advancing: "Advancing",
  };
  const candidateTier = path ? tierMap[path] || null : null;

  return {
    assessment_id: (body.assessment_id ?? body.assessmentId ?? null) as string | null,
    candidate_email: email,
    candidate_name: candidateName,
    archetype,
    archetype_type: archetypeType,
    dimension_scores: scores,
    matching_results: matchingResults,
    sector_matches: sectorMatches,
    geography_matches: geographyMatches,
    department_matches: departmentMatches,
    path,
    session_id: sessionId,
    source,
    completed_at: completedAt,
    candidate_tier: candidateTier,
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

  console.log("[dna-webhook] Received payload:", JSON.stringify(rawBody));

  const payload = normalisePayload(rawBody);

  // Validate required fields — only email is strictly required now
  if (!payload.candidate_email) {
    return new Response(
      JSON.stringify({
        error: "Missing required field: email",
        required: ["email OR candidate_email OR candidateEmail"],
        received_keys: Object.keys(rawBody),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate archetype value if provided
  if (payload.archetype) {
    const validArchetypes = ["lion", "whale", "falcon"];
    if (!validArchetypes.includes(payload.archetype.toLowerCase())) {
      return new Response(
        JSON.stringify({ error: `Invalid archetype. Must be one of: ${validArchetypes.join(", ")}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
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
      tribe_viral_archetype: payload.archetype?.toLowerCase() || null,
      tribe_viral_scores: payload.dimension_scores,
      dimension_scores: payload.dimension_scores,
      sector_matches: payload.sector_matches,
      geography_matches: payload.geography_matches,
      department_matches: payload.department_matches,
      completed_at: payload.completed_at || new Date().toISOString(),
      // New DNA app fields
      archetype_type: payload.archetype_type || null,
      dna_session_id: payload.session_id || null,
      candidate_tier: payload.candidate_tier || null,
      dna_source: payload.source || null,
      dna_path: payload.path || null,
      matching_results: payload.matching_results || null,
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
        archetype_type: payload.archetype_type,
        journey_id: journeyId,
        sector_matches: payload.sector_matches,
        geography_matches: payload.geography_matches,
        department_matches: payload.department_matches,
        path: payload.path,
        session_id: payload.session_id,
        source: payload.source,
        candidate_tier: payload.candidate_tier,
        status: "success",
      },
    });

    console.log("[dna-webhook] Candidate processed:", {
      id: candidate.id,
      email: payload.candidate_email,
      archetype: payload.archetype,
      tier: payload.candidate_tier,
    });

    return new Response(
      JSON.stringify({
        success: true,
        candidate_id: candidate.id,
        journey_id: journeyId,
        archetype: payload.archetype,
        tier: payload.candidate_tier,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[dna-webhook] Error:", err);
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
