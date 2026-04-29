// stage6-runner — Build #1C Stage 6 Part A
// One-off synthetic test harness. Calls the three webhook endpoints + fire-email-4
// using server-side secrets, then runs verification queries and returns a full report.
// Service-role auth (invoked from Lovable harness via curl_edge_functions).

import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const DNA_SECRET = Deno.env.get("DNA_INBOUND_SECRET")!;
const PORTAL_SECRET = Deno.env.get("PORTAL_INBOUND_SECRET")!;

const ALPHA = "john+stage6alpha@be.ie";
const BRAVO = "john+stage6bravo@be.ie";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function call(fn: string, headers: Record<string,string>, body: any) {
  const url = `${SUPABASE_URL}/functions/v1/${fn}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, body: json ?? text };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const auth = req.headers.get("authorization") || "";
  if (!auth.includes(SERVICE_KEY)) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: corsHeaders });
  }

  const action = new URL(req.url).searchParams.get("action") || "run";
  const report: any = { action, started_at: new Date().toISOString(), steps: [] };

  try {
    if (action === "cleanup" || action === "run") {
      // Pre-clean any leftovers
      await supabase.from("candidate_step_log").delete().in("candidate_email", [ALPHA, BRAVO]);
      const { data: existing } = await supabase.from("candidates").select("id").in("email", [ALPHA, BRAVO]);
      if (existing && existing.length > 0) {
        await supabase.from("candidates").delete().in("email", [ALPHA, BRAVO]);
      }
      report.steps.push({ name: "pre_cleanup", deleted_candidates: existing?.length ?? 0 });
    }

    if (action === "cleanup") {
      return new Response(JSON.stringify(report, null, 2), {
        status: 200, headers: { ...corsHeaders, "content-type": "application/json" },
      });
    }

    // ============================================================
    // ALPHA — full happy path
    // ============================================================
    const alphaAssessment = crypto.randomUUID();

    // STEP 1: dna-reveal-email-captured
    const r1 = await call("dna-reveal-email-captured", { "x-dna-secret": DNA_SECRET }, {
      email: ALPHA, first_name: "Alpha", last_name: "Tester",
      assessment_id: alphaAssessment, archetype: "Whale", path: "growing",
      eq: 75, scores: {},
    });
    report.steps.push({ name: "alpha_step1_dna_reveal", ...r1 });

    // Backdate step1 to >25 minutes ago
    const { error: backErr } = await supabase
      .from("candidate_step_log")
      .update({ completed_at: new Date(Date.now() - 25 * 60 * 1000).toISOString() })
      .eq("candidate_email", ALPHA).eq("step_number", 1);
    report.steps.push({ name: "alpha_backdate_step1", error: backErr?.message ?? null });

    // STEP 2: concierge-arrival (should fire — gate passes)
    const r2 = await call("concierge-arrival", { "x-portal-secret": PORTAL_SECRET }, {
      email: ALPHA, first_name: "Alpha", last_name: "Tester",
      assessment_id: alphaAssessment, archetype: "Whale", path: "growing",
      arrived_at: new Date().toISOString(), journey_type: "h2b_phase1_screening",
    });
    report.steps.push({ name: "alpha_step2_concierge_arrival", ...r2 });

    // STEP 3: profile-taking-shape
    const r3 = await call("profile-taking-shape", { "x-portal-secret": PORTAL_SECRET }, {
      email: ALPHA, first_name: "Alpha", last_name: "Tester",
      assessment_id: alphaAssessment,
      completed_steps: ["DNA assessment ✓", "Ethics agreement ✓"],
      outstanding_steps: ["Short video clip", "Career goals chat"],
      trigger_at: new Date().toISOString(),
      journey_type: "h2b_phase1_screening",
    });
    report.steps.push({ name: "alpha_step3_profile_taking_shape", ...r3 });

    // Lookup alpha id
    const { data: alphaRow } = await supabase.from("candidates").select("id").eq("email", ALPHA).maybeSingle();
    const alphaId = alphaRow?.id;

    // STEP 4: fire-email-4 force=true (service-role bearer)
    const r4 = await call("fire-email-4", { authorization: `Bearer ${SERVICE_KEY}` }, {
      candidate_id: alphaId, force: true,
    });
    report.steps.push({ name: "alpha_step4_fire_email_4_force", candidate_id: alphaId, ...r4 });

    // ============================================================
    // BRAVO — recency suppression
    // ============================================================
    const bravoAssessment = crypto.randomUUID();
    const r5 = await call("dna-reveal-email-captured", { "x-dna-secret": DNA_SECRET }, {
      email: BRAVO, first_name: "Bravo", last_name: "Tester",
      assessment_id: bravoAssessment, archetype: "Lion", path: "advancing",
      eq: 80, scores: {},
    });
    report.steps.push({ name: "bravo_step1_dna_reveal", ...r5 });

    // Immediately call concierge-arrival (should suppress)
    const r6 = await call("concierge-arrival", { "x-portal-secret": PORTAL_SECRET }, {
      email: BRAVO, first_name: "Bravo", last_name: "Tester",
      assessment_id: bravoAssessment, archetype: "Lion", path: "advancing",
      arrived_at: new Date().toISOString(), journey_type: "h2b_phase1_screening",
    });
    report.steps.push({ name: "bravo_step2_concierge_arrival_should_suppress", ...r6 });

    // ============================================================
    // VERIFICATION
    // ============================================================
    const { data: alphaCand } = await supabase.from("candidates").select("id, email, full_name, communication_status, current_journey_type").eq("email", ALPHA).maybeSingle();
    const { data: bravoCand } = await supabase.from("candidates").select("id, email, full_name, communication_status, current_journey_type").eq("email", BRAVO).maybeSingle();
    const { data: alphaSteps } = await supabase.from("candidate_step_log").select("step_number, step_name, source, completed_at").eq("candidate_email", ALPHA).order("step_number");
    const { data: bravoSteps } = await supabase.from("candidate_step_log").select("step_number, step_name, source, completed_at").eq("candidate_email", BRAVO).order("step_number");

    // Audit log: pull last 10 minutes of email events for our test addresses
    const { data: auditAlpha } = await supabase
      .from("audit_log")
      .select("event_type, payload, created_at")
      .in("event_type", ["email_sent", "email_sent_manual", "email_skipped_recency", "email_skipped_status"])
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .order("created_at", { ascending: true });

    const alphaEvents = (auditAlpha || []).filter((r: any) => r.payload?.candidate_id === alphaCand?.id);
    const bravoEvents = (auditAlpha || []).filter((r: any) => r.payload?.candidate_id === bravoCand?.id);

    report.verification = {
      alpha_candidate: alphaCand,
      alpha_step_log_count: alphaSteps?.length ?? 0,
      alpha_step_log: alphaSteps,
      alpha_audit_events: alphaEvents.map((e: any) => ({
        event_type: e.event_type,
        email_number: e.payload?.email_number,
        brevo_message_id: e.payload?.brevo_message_id,
        ok: e.payload?.ok,
      })),
      bravo_candidate: bravoCand,
      bravo_step_log_count: bravoSteps?.length ?? 0,
      bravo_step_log: bravoSteps,
      bravo_audit_events: bravoEvents.map((e: any) => ({
        event_type: e.event_type,
        email_number: e.payload?.email_number,
        brevo_message_id: e.payload?.brevo_message_id,
        ok: e.payload?.ok,
        minutes_since_step_1: e.payload?.minutes_since_step_1,
      })),
    };

    // Real-candidate impact check
    const { data: realImpact } = await supabase
      .from("audit_log")
      .select("payload, created_at")
      .in("event_type", ["email_sent", "email_sent_manual"])
      .gte("created_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
    const synthIds = [alphaCand?.id, bravoCand?.id].filter(Boolean);
    const realHits = (realImpact || []).filter((r: any) => r.payload?.candidate_id && !synthIds.includes(r.payload.candidate_id));
    report.verification.real_candidate_email_events_last_hour = realHits.length;
    report.verification.real_candidate_event_samples = realHits.slice(0, 5);

    const { data: realStatus } = await supabase
      .from("candidates")
      .select("communication_status")
      .not("email", "in", `(${ALPHA},${BRAVO})`);
    const statusCounts: Record<string, number> = {};
    (realStatus || []).forEach((r: any) => { statusCounts[r.communication_status] = (statusCounts[r.communication_status] || 0) + 1; });
    report.verification.real_candidate_status_counts = statusCounts;

    report.finished_at = new Date().toISOString();
    return new Response(JSON.stringify(report, null, 2), {
      status: 200, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (err) {
    report.error = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify(report, null, 2), {
      status: 500, headers: { ...corsHeaders, "content-type": "application/json" },
    });
  }
});
