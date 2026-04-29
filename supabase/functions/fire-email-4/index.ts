// fire-email-4
// Build #1C — Stage 3. Internal-use endpoint for manually firing Email #4
// (Profile Ready). Validates a service-role bearer token. Performs a
// completeness check (overridable with force=true). Updates the candidate's
// communication_status to 'complete' on success.

import { corsHeaders } from "../_shared/cors.ts";
import { makeServiceClient, writeStepLog } from "../_shared/candidates.ts";
import { sendTransactionalEmail, logEmailSkipped } from "../_shared/brevo.ts";
import { authenticateAdminOrService } from "../_shared/admin-auth.ts";

const ENDPOINT = "fire-email-4";

function unauthorized(msg = "Unauthorized") {
  return new Response(JSON.stringify({ error: msg }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function badRequest(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = makeServiceClient();

  // --- Auth: service-role bearer OR admin user JWT ---
  const auth = await authenticateAdminOrService(req, supabase);
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
  } catch {
    return badRequest({ error: "Invalid JSON body" });
  }

  try {
    return await handle(supabase, body);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${ENDPOINT}] uncaught:`, msg);
    await supabase.from("audit_log").insert({
      event_type: "webhook_db_error",
      payload: { endpoint: ENDPOINT, error: msg.slice(0, 300) },
    });
    return new Response(JSON.stringify({ error: "Internal error", detail: msg.slice(0, 300) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handle(supabase: any, body: any): Promise<Response> {
  const candidateId = body.candidate_id;
  const force = body.force === true;
  if (!candidateId || typeof candidateId !== "string") {
    return badRequest({ error: "candidate_id required" });
  }

  // --- Look up candidate ---
  const { data: candidate, error: candErr } = await supabase
    .from("candidates")
    .select("id, email, full_name, communication_status, video_clips, current_journey_type, organization_id")
    .eq("id", candidateId)
    .maybeSingle();

  if (candErr || !candidate) {
    return badRequest({ error: "candidate not found" });
  }

  const journeyType = candidate.current_journey_type || "h2b_phase1_screening";

  // --- Completeness check ---
  const missing: string[] = [];
  if (!force) {
    const { data: steps } = await supabase
      .from("candidate_step_log")
      .select("step_number")
      .eq("candidate_email", candidate.email)
      .eq("journey_type", journeyType);

    const stepNums = new Set((steps || []).map((s: any) => s.step_number));
    if (!stepNums.has(1)) missing.push("step_1_dna_reveal");
    if (!stepNums.has(2)) missing.push("step_2_concierge_arrival");
    if (!stepNums.has(3)) missing.push("step_3_profile_taking_shape");

    const { data: presc } = await supabase
      .from("prescreening_data")
      .select("ethics_signed")
      .eq("candidate_id", candidateId)
      .maybeSingle();
    if (!presc?.ethics_signed) missing.push("ethics_signed");

    const clips = Array.isArray(candidate.video_clips) ? candidate.video_clips : [];
    if (clips.length === 0) missing.push("video_clip");

    // candidate_preferences existence — table is not present in the current schema;
    // treat as satisfied if the table exists with a row, otherwise skip silently.
    try {
      const { data: prefs, error: prefsErr } = await supabase
        .from("candidate_preferences" as any)
        .select("id")
        .eq("candidate_id", candidateId)
        .maybeSingle();
      if (!prefsErr && !prefs) missing.push("candidate_preferences");
    } catch { /* table not present in this build — skip */ }

    if (missing.length > 0) {
      return badRequest({
        error: "Profile incomplete",
        missing,
        hint: "pass { force: true } to override",
      });
    }
  } else {
    await supabase.from("audit_log").insert({
      event_type: "fire_email_4_force",
      payload: { endpoint: ENDPOINT, candidate_id: candidateId, reason: "operator override (force=true)" },
    });
  }

  // --- Compute first_name ---
  const firstName =
    (candidate.full_name && candidate.full_name.trim().split(/\s+/)[0]) ||
    candidate.email.split("@")[0];

  // --- Write step 4 log row (idempotent) ---
  const step = await writeStepLog(supabase, {
    candidateEmail: candidate.email,
    candidateId: candidate.id,
    organizationId: candidate.organization_id,
    journeyType,
    stepNumber: 4,
    stepName: "profile_complete",
    source: "hub-manual",
    payload: { force, fired_at: new Date().toISOString() },
  });

  // --- Send Email #4 ---
  if (candidate.communication_status === "paused") {
    await logEmailSkipped(supabase, {
      templateKey: "b2c_email_4",
      candidateId: candidate.id,
      sourceEndpoint: ENDPOINT,
      emailNumber: 4,
      status: candidate.communication_status,
      reason: "candidate is paused — manual fire suppressed",
    });
    return new Response(
      JSON.stringify({ success: false, skipped: true, reason: "candidate paused" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const sendResult = await sendTransactionalEmail(supabase, {
    templateKey: "b2c_email_4",
    recipientEmail: candidate.email,
    candidateId: candidate.id,
    sourceEndpoint: ENDPOINT,
    emailNumber: 4,
    mergeParams: { first_name: firstName },
  });

  // --- Mark candidate complete on successful send ---
  if (sendResult.ok) {
    await supabase
      .from("candidates")
      .update({ communication_status: "complete" })
      .eq("id", candidate.id);
  }

  return new Response(
    JSON.stringify({
      success: sendResult.ok,
      brevo_message_id: sendResult.messageId ?? null,
      step_log_id: step.id,
      candidate_id: candidate.id,
      forced: force,
      error: sendResult.ok ? undefined : sendResult.error,
    }),
    {
      status: sendResult.ok ? 200 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
}

