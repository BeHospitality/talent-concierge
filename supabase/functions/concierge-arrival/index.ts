// concierge-arrival
// Build #1C — Stage 2. Step 2 of the funnel. Fired by connect.be.ie when a
// candidate arrives in the concierge portal post-DNA.

import { corsHeaders } from "../_shared/cors.ts";
import { validateSecret } from "../_shared/secrets.ts";
import {
  makeServiceClient,
  normaliseEmail,
  resolveCandidate,
  writeStepLog,
  ALLOWED_JOURNEY_TYPES,
} from "../_shared/candidates.ts";
import { sendTransactionalEmail, logEmailSkipped } from "../_shared/brevo.ts";

const ENDPOINT = "concierge-arrival";

// Email #2 attention-management gate (Board directive, 29 Apr 2026):
// Suppress Email #2 if Email #1 fired less than EMAIL_2_RECENT_DNA_THRESHOLD_MINUTES
// minutes ago. Rationale: a candidate who captures DNA reveal email
// and immediately clicks through to /concierge is already in the app —
// a second welcome email in their inbox 60 seconds later is noise,
// not value. Email #2 becomes a re-engagement trigger for candidates
// who arrive at /concierge AFTER wandering off.
const EMAIL_2_RECENT_DNA_THRESHOLD_MINUTES = 20;

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

    const step = await writeStepLog(supabase, {
      candidateEmail: email,
      candidateId: candidate.candidateId,
      organizationId: candidate.organizationId,
      journeyType: candidate.journeyType,
      stepNumber: 2,
      stepName: "concierge_arrival",
      source: "connect-portal",
      assessmentId: body.assessment_id ?? null,
      payload: {
        archetype: body.archetype ?? null,
        path: body.path ?? null,
        arrived_at: body.arrived_at ?? null,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
      },
    });

    await supabase.from("audit_log").insert({
      event_type: "concierge_arrival",
      payload: {
        endpoint: ENDPOINT,
        email,
        candidate_id: candidate.candidateId,
        candidate_created: candidate.created,
        step_log_id: step.id,
        deduped: step.deduped,
        communication_status: candidate.communicationStatus,
      },
    });

    if (candidate.communicationStatus === "auto_b2c_active") {
      // Recency gate: check most recent step 1 (dna_reveal_email_captured)
      const { data: step1Rows } = await supabase
        .from("candidate_step_log")
        .select("completed_at")
        .eq("candidate_email", email)
        .eq("journey_type", candidate.journeyType)
        .eq("step_number", 1)
        .order("completed_at", { ascending: false })
        .limit(1);

      const step1 = step1Rows?.[0];
      let suppressForRecency = false;
      let minutesSinceStep1: number | null = null;

      if (step1?.completed_at) {
        const completedMs = new Date(step1.completed_at).getTime();
        const nowMs = Date.now();
        // Future timestamp (clock skew) → treat as 0 minutes elapsed → suppress
        const diffMs = Math.max(0, nowMs - completedMs);
        minutesSinceStep1 = diffMs / 60000;
        if (minutesSinceStep1 < EMAIL_2_RECENT_DNA_THRESHOLD_MINUTES) {
          suppressForRecency = true;
        }
      } else {
        // No step 1 found (e.g., magic-link arrival) — default to firing.
        await supabase.from("audit_log").insert({
          event_type: "email_recency_gate_no_step1",
          payload: {
            endpoint: ENDPOINT,
            candidate_email: email,
            candidate_id: candidate.candidateId,
            email_number: 2,
            note: "No step 1 row found; recency gate not applicable, proceeding to send.",
          },
        });
      }

      if (suppressForRecency) {
        await supabase.from("audit_log").insert({
          event_type: "email_skipped_recency",
          payload: {
            endpoint: ENDPOINT,
            candidate_email: email,
            candidate_id: candidate.candidateId,
            email_number: 2,
            reason: "recent_dna_completion",
            threshold_minutes: EMAIL_2_RECENT_DNA_THRESHOLD_MINUTES,
            minutes_since_step_1: minutesSinceStep1,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        await sendTransactionalEmail(supabase, {
          templateKey: "b2c_email_2",
          recipientEmail: email,
          candidateId: candidate.candidateId,
          sourceEndpoint: ENDPOINT,
          emailNumber: 2,
          mergeParams: {
            first_name: candidate.firstName || "there",
          },
          triggerSource: "auto",
          communicationStatus: candidate.communicationStatus,
        });
      }
    } else {
      await logEmailSkipped(supabase, {
        templateKey: "b2c_email_2",
        candidateId: candidate.candidateId,
        candidateEmail: email,
        sourceEndpoint: ENDPOINT,
        emailNumber: 2,
        status: candidate.communicationStatus,
        reason: `communication_status='${candidate.communicationStatus}' — auto-fire suppressed`,
        triggerSource: "auto",
      });
    }

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
