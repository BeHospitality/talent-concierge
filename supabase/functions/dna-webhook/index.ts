import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let rawBody: Record<string, unknown>;
  try {
    rawBody = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("[dna-webhook] Received payload:", JSON.stringify(rawBody));

  const email = (rawBody.email ?? rawBody.candidate_email ?? rawBody.candidateEmail ?? null) as string | null;

  if (!email) {
    return new Response(
      JSON.stringify({
        error: "Missing required field: email",
        required: ["email OR candidate_email OR candidateEmail"],
        received_keys: Object.keys(rawBody),
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const archetype = (rawBody.archetype ?? rawBody.tribe_viral_archetype ?? null) as string | null;
  const archetype_type = (rawBody.archetype_type ?? null) as string | null;
  const scores = (rawBody.scores ?? rawBody.dimension_scores ?? rawBody.tribe_viral_scores ?? null) as Record<string, number> | null;
  const matching_results = (rawBody.matching_results ?? null) as Record<string, unknown> | null;
  const path = (rawBody.path ?? null) as string | null;
  const session_id = (rawBody.session_id ?? null) as string | null;
  const source = (rawBody.source ?? null) as string | null;
  const completed_at = (rawBody.completed_at ?? null) as string | null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const tierMap: Record<string, string> = {
    starting: "Starting Out",
    growing: "Growing",
    returning: "Returning",
    advancing: "Advancing",
  };

  const { data: record, error: upsertError } = await supabase
    .from("prescreening_data")
    .upsert(
      {
        candidate_email: email,
        archetype_type: archetype_type || null,
        tribe_viral_archetype: archetype ? archetype.toLowerCase() : null,
        tribe_viral_scores: scores || null,
        dimension_scores: scores || null,
        matching_results: matching_results || null,
        candidate_tier: tierMap[path ?? ""] || "Starting Out",
        dna_path: path || null,
        dna_session_id: session_id || null,
        dna_source: source || "dna-assessment",
        completed_at: completed_at || new Date().toISOString(),
      },
      {
        onConflict: "candidate_email",
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (upsertError) {
    console.error(
      "[dna-webhook] UPSERT FAILED:",
      upsertError.code,
      upsertError.message,
      upsertError.details,
      upsertError.hint
    );

    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_upsert_failed",
      payload: {
        email,
        error: upsertError.message,
        code: upsertError.code,
      },
    });

    return new Response(
      JSON.stringify({
        error: upsertError.message,
        code: upsertError.code,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await supabase.from("audit_log").insert({
    event_type: "dna_candidate_received",
    payload: {
      email,
      archetype,
      tier: tierMap[path ?? ""] || "Starting Out",
      path,
      session_id,
      source,
      record_id: record?.id,
    },
  });

  console.log("[dna-webhook] SUCCESS:", record?.id);

  return new Response(
    JSON.stringify({
      success: true,
      id: record?.id,
      email,
      archetype,
      tier: tierMap[path ?? ""] || "Starting Out",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
