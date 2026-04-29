// Build #1C — Stage 3 fix verification.
// One-off function: sends the four B2C templates to john@be.ie with realistic
// merge values, calling the shared sendTransactionalEmail helper directly.
// Does NOT touch candidates / candidate_step_log / communication_status.
// Service-role only — invoke from the dashboard or via curl with the key.

import { corsHeaders } from "../_shared/cors.ts";
import { makeServiceClient } from "../_shared/candidates.ts";
import { sendTransactionalEmail } from "../_shared/brevo.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = makeServiceClient();
  const recipient = "john@be.ie";

  const sends = [
    {
      templateKey: "b2c_email_1",
      emailNumber: 1,
      mergeParams: { first_name: "John", archetype: "Whale" },
    },
    {
      templateKey: "b2c_email_2",
      emailNumber: 2,
      mergeParams: { first_name: "John" },
    },
    {
      templateKey: "b2c_email_3",
      emailNumber: 3,
      mergeParams: {
        first_name: "John",
        completed_steps: "✓ DNA assessment\n✓ Ethics agreement",
        outstanding_steps: "• Short video clip\n• Career goals chat",
      },
    },
    {
      templateKey: "b2c_email_4",
      emailNumber: 4,
      mergeParams: { first_name: "John" },
    },
  ];

  const results = [];
  for (const s of sends) {
    const r = await sendTransactionalEmail(supabase, {
      templateKey: s.templateKey,
      recipientEmail: recipient,
      mergeParams: s.mergeParams,
      candidateId: null,
      sourceEndpoint: "stage3-rendering-test",
      emailNumber: s.emailNumber,
    });
    results.push({ template: s.templateKey, ...r });
  }

  return new Response(JSON.stringify({ recipient, results }, null, 2), {
    headers: { ...corsHeaders, "content-type": "application/json" },
    status: 200,
  });
});
