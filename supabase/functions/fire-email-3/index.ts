// fire-email-3
// Build #1C — Stage 5. Operator-initiated manual fire of Email #3 (Profile Taking Shape).
// Computes completed_steps + outstanding_steps from candidate state.

import { corsHeaders } from "../_shared/cors.ts";
import { makeServiceClient, writeStepLog } from "../_shared/candidates.ts";
import { sendTransactionalEmail, formatStepList } from "../_shared/brevo.ts";
import { timingSafeEqual } from "../_shared/secrets.ts";

const ENDPOINT = "fire-email-3";

function unauthorized() {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function badRequest(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = makeServiceClient();
  const authHeader = req.headers.get("authorization") || "";
  const expected = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const provided = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!expected || !provided || !timingSafeEqual(provided, expected)) {
    await supabase.from("audit_log").insert({
      event_type: "webhook_auth_failed", payload: { endpoint: ENDPOINT },
    });
    return unauthorized();
  }

  let body: any;
  try { body = await req.json(); } catch { return badRequest({ error: "Invalid JSON body" }); }
  const candidateId = body.candidate_id;
  const operatorUserId = body.operator_user_id ?? null;
  if (!candidateId || typeof candidateId !== "string") return badRequest({ error: "candidate_id required" });

  try {
    const { data: candidate, error: cErr } = await supabase
      .from("candidates")
      .select("id, email, full_name, current_journey_type, organization_id, video_clips")
      .eq("id", candidateId)
      .maybeSingle();
    if (cErr || !candidate) return badRequest({ error: "candidate not found" });

    const { data: presc } = await supabase
      .from("prescreening_data")
      .select("ethics_signed")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    const firstName =
      (candidate.full_name && candidate.full_name.trim().split(/\s+/)[0]) ||
      candidate.email.split("@")[0];
    const journeyType = candidate.current_journey_type || "h2b_phase1_screening";

    const { data: steps } = await supabase
      .from("candidate_step_log")
      .select("step_number")
      .eq("candidate_email", candidate.email)
      .eq("journey_type", journeyType);
    const stepNums = new Set((steps || []).map((s: any) => s.step_number));

    const ethicsSigned = !!(presc as any)?.ethics_signed;
    const hasVideo = Array.isArray(candidate.video_clips) && candidate.video_clips.length > 0;

    const completed: string[] = [];
    const outstanding: string[] = [];

    if (stepNums.has(1)) completed.push("DNA assessment revealed");
    else outstanding.push("Reveal DNA assessment");

    if (stepNums.has(2)) completed.push("Concierge welcome");
    else outstanding.push("Visit the Concierge");

    if (ethicsSigned) completed.push("Ethics & values signed");
    else outstanding.push("Sign ethics & values declaration");

    if (hasVideo) completed.push("Video introduction recorded");
    else outstanding.push("Record video introduction");

    const step = await writeStepLog(supabase, {
      candidateEmail: candidate.email, candidateId: candidate.id,
      organizationId: candidate.organization_id, journeyType,
      stepNumber: 3, stepName: "profile_taking_shape",
      source: "hub-manual",
      payload: { manual_fire: true, fired_at: new Date().toISOString() },
    });

    const sendResult = await sendTransactionalEmail(supabase, {
      templateKey: "b2c_email_3", recipientEmail: candidate.email,
      candidateId: candidate.id, sourceEndpoint: ENDPOINT, emailNumber: 3,
      mergeParams: {
        first_name: firstName,
        completed_steps: formatStepList(completed),
        outstanding_steps: formatStepList(outstanding),
      },
    });

    await supabase.from("audit_log").insert({
      event_type: "email_sent_manual",
      payload: {
        endpoint: ENDPOINT, email_number: 3,
        candidate_id: candidate.id, candidate_email: candidate.email,
        operator_user_id: operatorUserId,
        brevo_message_id: sendResult.messageId ?? null,
        ok: sendResult.ok, error: sendResult.ok ? null : sendResult.error,
      },
    });

    return new Response(
      JSON.stringify({
        success: sendResult.ok,
        brevo_message_id: sendResult.messageId ?? null,
        step_log_id: step.id,
        error: sendResult.ok ? undefined : sendResult.error,
      }),
      { status: sendResult.ok ? 200 : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${ENDPOINT}] uncaught:`, msg);
    await supabase.from("audit_log").insert({
      event_type: "webhook_db_error", payload: { endpoint: ENDPOINT, error: msg.slice(0, 300) },
    });
    return new Response(JSON.stringify({ error: "Internal error", detail: msg.slice(0, 300) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
