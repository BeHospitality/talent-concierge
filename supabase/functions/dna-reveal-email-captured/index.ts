// dna-reveal-email-captured
// Build #1C — Stage 2. Receives the "candidate revealed their email at the
// DNA assessment paywall" signal from the DNA app. Step 1 of the funnel.

import { corsHeaders } from "../_shared/cors.ts";
import { validateSecret } from "../_shared/secrets.ts";
import {
  makeServiceClient,
  normaliseEmail,
  resolveCandidate,
  writeStepLog,
  ALLOWED_JOURNEY_TYPES,
  BE_CONNECT_PORTAL_ORG_ID,
} from "../_shared/candidates.ts";
import { sendTransactionalEmail, logEmailSkipped } from "../_shared/brevo.ts";

const ENDPOINT = "dna-reveal-email-captured";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = makeServiceClient();

  // --- Auth ---
  const auth = validateSecret(req, "x-dna-secret", "DNA_INBOUND_SECRET");
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

  // --- Parse ---
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
    return new Response(
      JSON.stringify({ error: "Unknown journey_type" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // A4: auto-classify NEW B2C candidates as 'auto_b2c_active'.
    // B2B path is signalled by magic_link_token or a non-portal org_code.
    const isB2BPath =
      Boolean(body.magic_link_token) ||
      (body.org_code && body.org_code !== "BECONNECT_PORTAL");
    const initialStatus = isB2BPath ? "manual_review" : "auto_b2c_active";

    const candidate = await resolveCandidate(supabase, email, {
      firstName: body.first_name ?? null,
      lastName: body.last_name ?? null,
      inboundJourneyType: body.journey_type ?? null,
      referralSource: "dna-app",
      initialCommunicationStatus: initialStatus,
    });

    const step = await writeStepLog(supabase, {
      candidateEmail: email,
      candidateId: candidate.candidateId,
      organizationId: candidate.organizationId,
      journeyType: candidate.journeyType,
      stepNumber: 1,
      stepName: "dna_reveal_email_captured",
      source: "dna-app",
      assessmentId: body.assessment_id ?? null,
      payload: {
        archetype: body.archetype ?? null,
        path: body.path ?? null,
        eq: body.eq ?? null,
        scores: body.scores ?? null,
        first_name: body.first_name ?? null,
        last_name: body.last_name ?? null,
      },
    });

    await supabase.from("audit_log").insert({
      event_type: "dna_reveal_email_captured",
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

    // --- Email firing (best-effort) ---
    if (candidate.communicationStatus === "auto_b2c_active") {
      // Brevo subject template hard-codes "you're a {{params.archetype}}".
      // Normalise enum casing ("lion" -> "Lion"); fall back to a neutral
      // noun phrase that still parses with the "you're a" prefix.
      const rawArchetype: string | null = body.archetype ?? null;
      const archetype = rawArchetype
        ? rawArchetype.charAt(0).toUpperCase() + rawArchetype.slice(1).toLowerCase()
        : "natural fit";
      await sendTransactionalEmail(supabase, {
        templateKey: "b2c_email_1",
        recipientEmail: email,
        candidateId: candidate.candidateId,
        sourceEndpoint: ENDPOINT,
        emailNumber: 1,
        mergeParams: {
          first_name: candidate.firstName || "there",
          archetype,
        },
      });
    } else {
      await logEmailSkipped(supabase, {
        templateKey: "b2c_email_1",
        candidateId: candidate.candidateId,
        sourceEndpoint: ENDPOINT,
        emailNumber: 1,
        status: candidate.communicationStatus,
        reason: `communication_status='${candidate.communicationStatus}' — auto-fire suppressed`,
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
