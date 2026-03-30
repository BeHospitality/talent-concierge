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

  const tier = tierMap[path ?? ""] || "Starting Out";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // ─── Try to find an existing candidate by email ───
    const { data: candidate } = await supabase
      .from("candidates")
      .select("id, full_name, organization_id")
      .eq("email", email)
      .maybeSingle();

    // Build prescreening record
    const prescreeningRecord: Record<string, unknown> = {
      candidate_email: email,
      tribe_viral_archetype: archetype?.toLowerCase() || null,
      archetype_type: archetype_type || null,
      dimension_scores: scores || null,
      tribe_viral_scores: scores || null,
      matching_results: matching_results || null,
      candidate_tier: tier,
      dna_path: path || null,
      dna_session_id: session_id || null,
      dna_source: source || "dna-assessment",
      completed_at: completed_at || new Date().toISOString(),
    };

    // If candidate exists in candidates table, link to them
    if (candidate) {
      prescreeningRecord.candidate_id = candidate.id;
      prescreeningRecord.organization_id = candidate.organization_id;

      // Also mark prescreening as complete
      await supabase
        .from("candidates")
        .update({ prescreening_complete: true })
        .eq("id", candidate.id);
    }

    // Upsert into prescreening_data — always create if not found
    const { data, error } = await supabase
      .from("prescreening_data")
      .upsert(prescreeningRecord, {
        onConflict: "candidate_email",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error("[dna-webhook] Upsert failed:", error);
      throw error;
    }

    // Log to audit trail
    await supabase.from("audit_log").insert({
      event_type: "dna_candidate_received",
      payload: { email, archetype, tier, path, source },
    });

    console.log("[dna-webhook] Prescreening upserted:", {
      id: data?.id,
      email,
      archetype,
      tier,
      linked_candidate: candidate?.id || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        prescreening_id: data?.id,
        candidate_id: candidate?.id || null,
        archetype,
        tier,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[dna-webhook] Error:", err);
    await supabase
      .from("audit_log")
      .insert({
        event_type: "dna_webhook_error",
        payload: { email, archetype, error: String(err) },
      })
      .catch(() => {});

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
