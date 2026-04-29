// profile-taking-shape
// Build #1C — Stage 2. Step 3 of the funnel. Fired by connect.be.ie when
// the candidate's portal profile reaches a milestone of completeness.

import { corsHeaders } from "../_shared/cors.ts";
import { validateSecret } from "../_shared/secrets.ts";
import {
  makeServiceClient,
  normaliseEmail,
  resolveCandidate,
  writeStepLog,
  ALLOWED_JOURNEY_TYPES,
} from "../_shared/candidates.ts";
import { sendTransactionalEmail, logEmailSkipped, formatStepList } from "../_shared/brevo.ts";

const ENDPOINT = "profile-taking-shape";

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

  const email = normaliseEmail(body.email);
  if (!email || !email.includes("@")) {
    return new Response(JSON.stringify({ error: "email required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (
    body.journey_type &&
    !ALLOWED_JOURNEY_TYPES.includes(String(body.journey_type))
  ) {
    return new Response(JSON.stringify({ error: "Unknown journey_type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const candidate = await resolveCandidate(supabase, email, {
      firstName: body.first_name ?? null,
      lastName: body.last_name ?? null,
      inboundJourneyType: body.journey_type ?? null,
      referralSource: "connect-portal",
    });

    const completedSteps = Array.isArray(body.completed_steps)
      ? body.completed_steps
      : [];
    const outstandingSteps = Array.isArray(body.outstanding_steps)
      ? body.outstanding_steps
      : [];

    const step = await writeStepLog(supabase, {
      candidateEmail: email,
      candidateId: candidate.candidateId,
      organizationId: candidate.organizationId,
      journeyType: candidate.journeyType,
      stepNumber: 3,
      stepName: "profile_taking_shape",
      source: "connect-portal",
      assessmentId: body.assessment_id ?? null,
      payload: {
        completed_steps: completedSteps,
        outstanding_steps: outstandingSteps,
        trigger_at: body.trigger_at ?? null,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
      },
    });

    await supabase.from("audit_log").insert({
      event_type: "profile_taking_shape",
      payload: {
        endpoint: ENDPOINT,
        email,
        candidate_id: candidate.candidateId,
        candidate_created: candidate.created,
        step_log_id: step.id,
        deduped: step.deduped,
        completed_count: completedSteps.length,
        outstanding_count: outstandingSteps.length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        step_log_id: step.id,
        candidate_id: candidate.candidateId,
        deduped: step.deduped,
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
      payload: { endpoint: ENDPOINT, email },
    });
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
