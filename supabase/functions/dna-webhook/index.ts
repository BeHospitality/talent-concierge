import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const tierMap: Record<string, string> = {
  starting: "Starting Out",
  growing: "Growing",
  returning: "Returning",
  advancing: "Advancing",
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

  // Normalise email field (support multiple naming conventions)
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

  try {
    // Validate archetype against the enum — only allow valid values
    const validArchetypes = ["lion", "whale", "falcon"];
    const normalisedArchetype = archetype ? archetype.toLowerCase() : null;
    const safeArchetype = normalisedArchetype && validArchetypes.includes(normalisedArchetype)
      ? normalisedArchetype
      : null;

    // Upsert into prescreening_data
    const { data, error } = await supabase
      .from("prescreening_data")
      .upsert(
        {
          candidate_email: email,
          archetype_type: archetype_type || null,
          tribe_viral_archetype: safeArchetype,
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

    console.log("[dna-webhook] Upsert result:", JSON.stringify({ data, error }));

    if (error) {
      console.error("[dna-webhook] UPSERT FAILED:", error.code, error.message, error.details, error.hint);
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If candidate exists, link and mark prescreening complete
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, organization_id")
      .eq("email", email)
      .maybeSingle();

    if (candidate) {
      await supabase
        .from("prescreening_data")
        .update({
          candidate_id: candidate.id,
          organization_id: candidate.organization_id,
        })
        .eq("id", data.id);

      await supabase
        .from("candidates")
        .update({ prescreening_complete: true })
        .eq("id", candidate.id);
    }

    // Log to audit trail
    await supabase.from("audit_log").insert({
      event_type: "dna_candidate_received",
      payload: {
        email,
        archetype: safeArchetype,
        tier: tierMap[path ?? ""] || "Starting Out",
        path,
        source: source || "dna-assessment",
      },
    });

    console.log("[dna-webhook] Prescreening upserted:", {
      id: data.id,
      email,
      archetype: safeArchetype,
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: data.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[dna-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
