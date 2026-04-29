// fire-email-1
// Build #1C — Stage 5. Operator-initiated manual fire of Email #1 (Archetype Reveal).
// Service-role bearer auth. Idempotent step_log write. audit_log entry as
// event_type='email_sent_manual'.

import { corsHeaders } from "../_shared/cors.ts";
import { makeServiceClient, writeStepLog } from "../_shared/candidates.ts";
import { sendTransactionalEmail } from "../_shared/brevo.ts";
import { authenticateAdminOrService } from "../_shared/admin-auth.ts";

const ENDPOINT = "fire-email-1";

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

  const auth = await authenticateAdminOrService(req, supabase);
  if (!auth.ok) {
    await supabase.from("audit_log").insert({
      event_type: "webhook_auth_failed",
      payload: { endpoint: ENDPOINT, status: auth.status },
    });
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: any;
  try { body = await req.json(); } catch { return badRequest({ error: "Invalid JSON body" }); }

  const candidateId = body.candidate_id;
  const operatorUserId = auth.operatorUserId ?? body.operator_user_id ?? null;
  if (!candidateId || typeof candidateId !== "string") {
    return badRequest({ error: "candidate_id required" });
  }

  try {
    const { data: candidate, error: cErr } = await supabase
      .from("candidates")
      .select("id, email, full_name, communication_status, current_journey_type, organization_id")
      .eq("id", candidateId)
      .maybeSingle();
    if (cErr || !candidate) return badRequest({ error: "candidate not found" });

    const { data: presc } = await supabase
      .from("prescreening_data")
      .select("tribe_viral_archetype, archetype_type")
      .eq("candidate_id", candidateId)
      .maybeSingle();

    const firstName =
      (candidate.full_name && candidate.full_name.trim().split(/\s+/)[0]) ||
      candidate.email.split("@")[0];
    const archetype =
      (presc as any)?.archetype_type ||
      (presc as any)?.tribe_viral_archetype ||
      "Hospitality DNA Profile";

    const journeyType = candidate.current_journey_type || "h2b_phase1_screening";

    const step = await writeStepLog(supabase, {
      candidateEmail: candidate.email,
      candidateId: candidate.id,
      organizationId: candidate.organization_id,
      journeyType,
      stepNumber: 1,
      stepName: "dna_reveal_email_captured",
      source: "hub-manual",
      payload: { manual_fire: true, fired_at: new Date().toISOString() },
    });

    const sendResult = await sendTransactionalEmail(supabase, {
      templateKey: "b2c_email_1",
      recipientEmail: candidate.email,
      candidateId: candidate.id,
      sourceEndpoint: ENDPOINT,
      emailNumber: 1,
      mergeParams: { first_name: firstName, archetype: String(archetype) },
    });

    await supabase.from("audit_log").insert({
      event_type: "email_sent_manual",
      payload: {
        endpoint: ENDPOINT,
        email_number: 1,
        candidate_id: candidate.id,
        candidate_email: candidate.email,
        operator_user_id: operatorUserId,
        brevo_message_id: sendResult.messageId ?? null,
        ok: sendResult.ok,
        error: sendResult.ok ? null : sendResult.error,
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
      event_type: "webhook_db_error",
      payload: { endpoint: ENDPOINT, error: msg.slice(0, 300) },
    });
    return new Response(JSON.stringify({ error: "Internal error", detail: msg.slice(0, 300) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
