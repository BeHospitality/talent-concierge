// AC3 test: backdate step 1 by 25 minutes, fire concierge-arrival again.
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SR = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const PORTAL_SECRET = Deno.env.get("PORTAL_INBOUND_SECRET")!;
  const url = new URL(req.url);
  const email = url.searchParams.get("email")!;

  const sb = createClient(SUPABASE_URL, SR);

  const past = new Date(Date.now() - 25 * 60 * 1000).toISOString();
  const { data: upd, error: updErr } = await sb
    .from("candidate_step_log")
    .update({ completed_at: past })
    .eq("candidate_email", email)
    .eq("step_number", 1)
    .select("id, completed_at");

  const r2 = await fetch(`${SUPABASE_URL}/functions/v1/concierge-arrival`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-portal-secret": PORTAL_SECRET,
    },
    body: JSON.stringify({
      email,
      first_name: "GateTest",
      arrived_at: new Date().toISOString(),
    }),
  });
  const r2body = await r2.text();

  return new Response(
    JSON.stringify({
      backdated: upd, updateError: updErr,
      concierge_arrival_2nd: { status: r2.status, body: r2body },
    }, null, 2),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
