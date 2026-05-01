import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateSecret } from "../_shared/secrets.ts";

// CORS headers — extended to accept x-dna-secret per Build #1C Stage 2
// security retrofit (closes the unauthenticated-endpoint GDPR gap).
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-dna-secret",
};

const BE_CONNECT_PORTAL_ORG_ID = "2deabbf5-6223-4c77-831c-b87b90d17ee6";

// Stage 7E Mod 2 — boundary normalisation for DNA dimension keys.
// DNA app currently emits lowercase (autonomy, collaboration, ...);
// Hub canonical form is Title Case. Trust no inputs; normalise once; store canonically.
const EXPECTED_PRIMARY_DIMENSIONS = [
  "Adaptability",
  "Collaboration",
  "Autonomy",
  "Leadership",
  "Precision",
];

function normaliseDimensionKeys(
  scores: Record<string, number> | null,
): Record<string, number> | null {
  if (!scores || typeof scores !== "object") return null;
  const titleCase = (s: string) =>
    s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [titleCase(k), v]),
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // --- Security retrofit: x-dna-secret validation (Build #1C Stage 2) ---
  // Must run before any DB write. Shares DNA_INBOUND_SECRET with
  // dna-reveal-email-captured (single secret per source).
  const auth = validateSecret(req, "x-dna-secret", "DNA_INBOUND_SECRET");
  if (!auth.ok) {
    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_auth_failed",
      payload: { endpoint: "dna-webhook", status: auth.status },
    });
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const email = body.email || body.candidate_email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tierMap: Record<string, string> = {
      starting: "Starting Out",
      growing: "Growing",
      returning: "Returning",
      advancing: "Advancing",
    };

    // Derive structured fields from matching_results when top-level scores
    // are not provided. The DNA app sends the full payload nested inside
    // matching_results (comprehensiveScores, sectorMatches, etc.).
    const mr = body.matching_results || {};
    const comprehensive = mr.comprehensiveScores || null;
    const sectorMatches = Array.isArray(mr.sectorMatches) ? mr.sectorMatches : null;
    const departmentMatches = Array.isArray(mr.departmentMatches) ? mr.departmentMatches : null;
    const geographyMatches = Array.isArray(mr.geographyMatches) ? mr.geographyMatches : null;

    // Stage 7E Mod 2 — validate inbound shape, normalise to Title Case,
    // audit-log mismatches and normalisations.
    const rawDimensionScores = body.scores || comprehensive || null;
    const normalisedDimensionScores = normaliseDimensionKeys(rawDimensionScores);

    let primaryScoresValid = false;
    let comprehensiveScoresFallback: Record<string, number> | null = null;

    if (normalisedDimensionScores && typeof normalisedDimensionScores === "object") {
      const incomingKeys = Object.keys(normalisedDimensionScores);
      const matchingKeys = EXPECTED_PRIMARY_DIMENSIONS.filter((k) =>
        incomingKeys.includes(k)
      );
      primaryScoresValid = matchingKeys.length === 5;

      if (!primaryScoresValid) {
        comprehensiveScoresFallback = normalisedDimensionScores;
        await supabase.from("audit_log").insert({
          event_type: "dna_webhook_shape_mismatch",
          payload: {
            candidate_email: body.email || null,
            assessment_id: body.assessment_id || null,
            incoming_key_count: incomingKeys.length,
            incoming_keys_sample: incomingKeys.slice(0, 10),
            expected_keys: EXPECTED_PRIMARY_DIMENSIONS,
            matching_keys: matchingKeys,
          },
        });
      } else if (
        rawDimensionScores &&
        JSON.stringify(Object.keys(rawDimensionScores).sort()) !==
          JSON.stringify(Object.keys(normalisedDimensionScores).sort())
      ) {
        await supabase.from("audit_log").insert({
          event_type: "dna_webhook_keys_normalised",
          payload: {
            candidate_email: body.email || null,
            assessment_id: body.assessment_id || null,
            incoming_keys: Object.keys(rawDimensionScores),
            normalised_to: "title_case",
          },
        });
      }
    }

    const dimensionScoresToPersist = primaryScoresValid
      ? normalisedDimensionScores
      : null;
    const comprehensiveScoresToPersist = primaryScoresValid
      ? null
      : comprehensiveScoresFallback;

    // tribe_viral_scores: prefer explicit body.tribe_scores / body.scores,
    // else fall back to a single-archetype map derived from the named archetype
    let tribeScores = body.tribe_scores || null;
    if (!tribeScores && body.archetype && comprehensive) {
      // Use top dimension as a proxy weight if no explicit archetype scores exist
      tribeScores = { [String(body.archetype).toLowerCase()]: 100 };
    }

    // Convert rich match arrays into string arrays for the *_matches columns
    // while preserving full objects in matching_results.
    const sectorMatchStrings = sectorMatches
      ? sectorMatches.map((s: any) => JSON.stringify(s))
      : null;
    const departmentMatchStrings = departmentMatches
      ? departmentMatches.map((d: any) => JSON.stringify(d))
      : null;
    const geographyMatchStrings = geographyMatches
      ? geographyMatches.map((g: any) => JSON.stringify(g))
      : null;

    const record = {
      candidate_email: email,
      first_name: body.first_name || null,
      last_name: body.last_name || null,
      assessment_id: body.assessment_id || null,
      video_storage_path: body.video_storage_path || null,
      archetype_type: body.archetype_type || null,
      tribe_viral_archetype: body.archetype
        ? body.archetype.toLowerCase()
        : null,
      tribe_viral_scores: tribeScores,
      dimension_scores: dimensionScores,
      matching_results: body.matching_results || null,
      sector_matches: sectorMatchStrings,
      department_matches: departmentMatchStrings,
      geography_matches: geographyMatchStrings,
      candidate_tier: tierMap[body.path] || null,
      dna_path: body.path || null,
      dna_session_id: body.session_id || null,
      dna_source: body.source || "dna-assessment",
      completed_at: body.completed_at || new Date().toISOString(),
      ethics_signed: body.ethics_signed || false,
      ethics_signed_at: body.ethics_signed_at || null,
      video_url: body.video_url || null,
      video_uploaded_at: body.video_uploaded_at || null,
      portal_source: body.source || null,
    };

    // --- Upsert prescreening_data (race-safe on candidate_email) ---
    const { data: result, error: upsertError } = await supabase
      .from("prescreening_data")
      .upsert(record, { onConflict: "candidate_email" })
      .select()
      .single();
    if (upsertError) throw upsertError;

    // --- Ensure candidate record exists ---
    let candidateId: string | null = null;

    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingCandidate) {
      candidateId = existingCandidate.id;
    } else {
      // Resolve organization: use org_code from payload, or fall back to Portal Unassigned
      let orgId = BE_CONNECT_PORTAL_ORG_ID;
      if (body.org_code) {
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("org_code", body.org_code)
          .maybeSingle();
        if (org) orgId = org.id;
      }

      const candidateName =
        [body.first_name, body.last_name]
          .filter((p) => p && String(p).trim().length > 0)
          .join(" ")
          .trim() ||
        email.split("@")[0];

      const { data: newCandidate, error: candError } = await supabase
        .from("candidates")
        .insert({
          full_name: candidateName,
          email: email,
          organization_id: orgId,
          current_stage: "pre_screening",
          prescreening_complete: true,
          referral_source: body.source || "portal",
        })
        .select("id")
        .single();

      if (candError) {
        console.error("[dna-webhook] Candidate insert failed:", candError);
      } else if (newCandidate) {
        candidateId = newCandidate.id;
      }
    }

    // Link prescreening_data to candidate
    if (candidateId) {
      await supabase
        .from("prescreening_data")
        .update({ candidate_id: candidateId })
        .eq("candidate_email", email);
    }

    // --- Sync video_url to candidates.video_clips ---
    if (body.video_url && candidateId) {
      const { data: candidateRecord } = await supabase
        .from("candidates")
        .select("id, video_clips")
        .eq("id", candidateId)
        .maybeSingle();

      if (candidateRecord) {
        const newClip: Record<string, unknown> = {
          id: crypto.randomUUID(),
          title: "Introduction",
          url: body.video_url,
          uploaded_at: body.video_uploaded_at || new Date().toISOString(),
        };
        if (body.video_storage_path) {
          newClip.storage_path = body.video_storage_path;
        }

        const existingClips: any[] = candidateRecord.video_clips || [];
        const alreadyExists = existingClips.some(
          (c: any) => c.url === body.video_url
        );

        if (!alreadyExists) {
          const updatedClips = [...existingClips, newClip];
          await supabase
            .from("candidates")
            .update({ video_clips: updatedClips })
            .eq("id", candidateId);
          console.log("[dna-webhook] video_clips updated for:", email);
        }
      }
    }

    // --- Audit log ---
    await supabase.from("audit_log").insert({
      event_type: "dna_candidate_received",
      payload: {
        email,
        archetype: body.archetype,
        tier: tierMap[body.path] || null,
        path: body.path,
        source: body.source,
        record_id: result?.id,
        candidate_id: candidateId,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: result?.id,
        candidate_id: candidateId,
        email,
        archetype: body.archetype,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[dna-webhook] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
