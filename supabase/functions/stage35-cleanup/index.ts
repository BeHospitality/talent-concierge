// Cleanup test candidate from Stage 3.5 testing.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const url = new URL(req.url);
  const email = url.searchParams.get("email")!;
  const sl = await sb.from("candidate_step_log").delete().eq("candidate_email", email).select("id");
  const c = await sb.from("candidates").delete().eq("email", email).select("id");
  return new Response(JSON.stringify({ step_log_deleted: sl.data, candidates_deleted: c.data }, null, 2),
    { headers: { "Content-Type": "application/json" } });
});
