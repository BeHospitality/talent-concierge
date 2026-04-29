// preferences-webhook
// Build #1C — Stage 7A. Receives candidate preference snapshots from
// connect.be.ie's AI Concierge (live extractions) and the
// backfill-preferences batch script. History-preserving: every POST
// inserts a new snapshot row unless deduplicated by request_id.

import { corsHeaders } from "../_shared/cors.ts";
import { validateSecret } from "../_shared/secrets.ts";
import {
  makeServiceClient,
  normaliseEmail,
  ALLOWED_JOURNEY_TYPES,
} from "../_shared/candidates.ts";

const ENDPOINT = "preferences-webhook";

const ALLOWED_SOURCES = [
  "connect-portal-live",
  "connect-portal-backfill",
  "hub-manual",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = makeServiceClient();

  const auth = validateSecret(req, "x-portal-secret", "PORTAL_INBOUND_SECRET");
  if (!auth.ok) {
    await supabase.from("audit_log").insert({
      event_type: "webhook_auth_failed",
      payload: { endpoint: ENDPOINT, status: auth.status },
    });
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch (_e) {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = normaliseEmail(body.candidate_email);
  if (!email || !email.includes("@")) {
    return new Response(
      JSON.stringify({ error: "candidate_email required" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const preferences = body.preferences;
  if (
    !preferences ||
    typeof preferences !== "object" ||
    Array.isArray(preferences)
  ) {
    return new Response(
      JSON.stringify({ error: "preferences must be an object" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const source = String(body.source ?? "");
  if (!ALLOWED_SOURCES.includes(source)) {
    return new Response(
      JSON.stringify({
        error: `source must be one of ${ALLOWED_SOURCES.join(", ")}`,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  const journeyType = body.journey_type
    ? String(body.journey_type)
    : "h2b_phase1_screening";
  if (!ALLOWED_JOURNEY_TYPES.includes(journeyType)) {
    return new Response(JSON.stringify({ error: "Unknown journey_type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const requestId =
    body.request_id && typeof body.request_id === "string"
      ? body.request_id.trim()
      : null;
  const extractionMetadata =
    body.extraction_metadata &&
    typeof body.extraction_metadata === "object" &&
    !Array.isArray(body.extraction_metadata)
      ? body.extraction_metadata
      : null;

  try {
    // Dedupe check
    if (requestId) {
      const { data: existing } = await supabase
        .from("candidate_preferences")
        .select("id")
        .eq("request_id", requestId)
        .maybeSingle();

      if (existing) {
        await supabase.from("audit_log").insert({
          event_type: "preferences_deduplicated",
          payload: {
            endpoint: ENDPOINT,
            candidate_email: email,
            request_id: requestId,
            row_id: existing.id,
            source,
          },
        });
        return new Response(
          JSON.stringify({ ok: true, deduplicated: true, row_id: existing.id }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Resolve candidate_id (best-effort; null is acceptable)
    const { data: candidateRow } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    const candidateId = candidateRow?.id ?? null;

    const { data: inserted, error: insertErr } = await supabase
      .from("candidate_preferences")
      .insert({
        candidate_email: email,
        candidate_id: candidateId,
        journey_type: journeyType,
        source,
        preferences,
        extraction_metadata: extractionMetadata,
        request_id: requestId,
      })
      .select("id")
      .single();

    if (insertErr || !inserted) {
      throw insertErr ?? new Error("Insert returned no row");
    }

    const presentKeys = Object.entries(preferences)
      .filter(([_, v]) => v !== null && v !== undefined && v !== "")
      .map(([k]) => k);

    await supabase.from("audit_log").insert({
      event_type: "preferences_received",
      payload: {
        endpoint: ENDPOINT,
        candidate_email: email,
        candidate_id: candidateId,
        candidate_matched: candidateId !== null,
        row_id: inserted.id,
        source,
        journey_type: journeyType,
        request_id: requestId,
        preference_keys_present: presentKeys,
      },
    });

    return new Response(
      JSON.stringify({
        ok: true,
        row_id: inserted.id,
        candidate_matched: candidateId !== null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error(`[${ENDPOINT}] DB error:`, err);
    await supabase.from("audit_log").insert({
      event_type: "webhook_db_error",
      payload: {
        endpoint: ENDPOINT,
        candidate_email: email,
        error_message: err instanceof Error ? err.message : String(err),
      },
    });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
