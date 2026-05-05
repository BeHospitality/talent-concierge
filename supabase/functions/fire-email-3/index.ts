// fire-email-3
// Build #1C — Stage 5 + Fix 1.3 + Fix 1.5/1.6.
// Operator-initiated manual fire of Email #3 (Profile Taking Shape).

import { corsHeaders } from "../_shared/cors.ts";
import { makeServiceClient, writeStepLog } from "../_shared/candidates.ts";
import {
  sendTransactionalEmail,
  logEmailSkipped,
  formatStepList,
  getRecentSendWithinWindow,
} from "../_shared/brevo.ts";
import { authenticateAdminOrService } from "../_shared/admin-auth.ts";

const ENDPOINT = "fire-email-3";
const EMAIL_NUMBER = 3;
const TEMPLATE_KEY = "b2c_email_3";
const DUP_WINDOW_MINUTES = 10;

function badRequest(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = makeServiceClient();
  const auth = await authenticateAdminOrService(req, supabase);
  if (!auth.ok) {
    await supabase.from("audit_log").insert({
      event_type: "webhook_auth_failed", payload: { endpoint: ENDPOINT, status: auth.status },
    });
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try { body = await req.json(); } catch { return badRequest({ error: "Invalid JSON body" }); }
  const candidateId = body.candidate_id;
  const operatorUserId = auth.operatorUserId ?? body.operator_user_id ?? null;
  const force = body.force === true;
  if (!candidateId || typeof candidateId !== "string") return badRequest({ error: "candidate_id required" });

  try {
    const { data: candidate, error: cErr } = await supabase
      .from("candidates")
      .select("id, email, full_name, communication_status, current_journey_type, organization_id, video_clips")
      .eq("id", candidateId)
      .maybeSingle();
    if (cErr || !candidate) return badRequest({ error: "candidate not found" });

    if (!force) {
      const recent = await getRecentSendWithinWindow(supabase, {
        candidateId: candidate.id, emailNumber: EMAIL_NUMBER, windowMinutes: DUP_WINDOW_MINUTES,
      });
      if (recent) {
        await logEmailSkipped(supabase, {
          templateKey: TEMPLATE_KEY, candidateId: candidate.id, candidateEmail: candidate.email,
          sourceEndpoint: ENDPOINT, emailNumber: EMAIL_NUMBER,
          status: candidate.communication_status,
          reason: `duplicate_send_within_${DUP_WINDOW_MINUTES}m`,
          triggerSource: "manual", operatorUserId, eventType: "email_skipped_duplicate",
        });
        return new Response(JSON.stringify({
          success: false, skipped: true, reason: "duplicate_send_within_window",
          window_minutes: DUP_WINDOW_MINUTES,
          previous_send_at: recent.created_at,
          previous_brevo_message_id: recent.payload?.brevo_message_id ?? null,
          hint: "pass { force: true } to override",
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

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
    if (stepNums.has(1)) completed.push("DNA assessment revealed"); else outstanding.push("Reveal DNA assessment");
    if (stepNums.has(2)) completed.push("Concierge welcome"); else outstanding.push("Visit the Concierge");
    if (ethicsSigned) completed.push("Ethics & values signed"); else outstanding.push("Sign ethics & values declaration");
    if (hasVideo) completed.push("Video introduction recorded"); else outstanding.push("Record video introduction");

    const step = await writeStepLog(supabase, {
      candidateEmail: candidate.email, candidateId: candidate.id,
      organizationId: candidate.organization_id, journeyType,
      stepNumber: 3, stepName: "profile_taking_shape",
      source: "hub-manual",
      payload: { manual_fire: true, fired_at: new Date().toISOString() },
    });

    const sendResult = await sendTransactionalEmail(supabase, {
      templateKey: TEMPLATE_KEY, recipientEmail: candidate.email,
      candidateId: candidate.id, sourceEndpoint: ENDPOINT, emailNumber: EMAIL_NUMBER,
      mergeParams: {
        first_name: firstName,
        completed_steps: formatStepList(completed),
        outstanding_steps: formatStepList(outstanding),
      },
      triggerSource: "manual",
      communicationStatus: candidate.communication_status,
      operatorUserId,
    });

    return new Response(
      JSON.stringify({
        success: sendResult.ok,
        brevo_message_id: sendResult.messageId ?? null,
        step_log_id: step.id,
        forced: force,
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
