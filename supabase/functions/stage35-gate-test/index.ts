// Temporary test runner for Stage 3.5 recency gate.
// Calls dna-reveal-email-captured then concierge-arrival back-to-back
// using the in-environment secrets.

import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (_req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const DNA_SECRET = Deno.env.get("DNA_INBOUND_SECRET")!;
  const PORTAL_SECRET = Deno.env.get("PORTAL_INBOUND_SECRET")!;

  const email = `test+gate-${Date.now()}@be.ie`;

  const r1 = await fetch(`${SUPABASE_URL}/functions/v1/dna-reveal-email-captured`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dna-secret": DNA_SECRET,
    },
    body: JSON.stringify({
      email,
      first_name: "GateTest",
      archetype: "explorer",
      path: "tradition",
      assessment_id: crypto.randomUUID(),
    }),
  });
  const r1body = await r1.text();

  // No wait — immediate concierge arrival
  const r2 = await fetch(`${SUPABASE_URL}/functions/v1/concierge-arrival`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-portal-secret": PORTAL_SECRET,
    },
    body: JSON.stringify({
      email,
      first_name: "GateTest",
      archetype: "explorer",
      path: "tradition",
      arrived_at: new Date().toISOString(),
    }),
  });
  const r2body = await r2.text();

  return new Response(
    JSON.stringify({
      test_email: email,
      dna_reveal: { status: r1.status, body: r1body },
      concierge_arrival: { status: r2.status, body: r2body },
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
