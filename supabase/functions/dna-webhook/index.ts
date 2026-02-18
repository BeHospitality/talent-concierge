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
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { assessment_id, candidate_email, archetype, dimension_scores } = body as {
    assessment_id?: string;
    candidate_email?: string;
    archetype?: string;
    dimension_scores?: Record<string, number>;
  };

  // Validate required fields
  if (!assessment_id || !candidate_email || !archetype || !dimension_scores) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        required: ["assessment_id", "candidate_email", "archetype", "dimension_scores"],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Validate archetype value
  const validArchetypes = ["lion", "whale", "falcon"];
  if (!validArchetypes.includes(archetype.toLowerCase())) {
    return new Response(
      JSON.stringify({ error: `Invalid archetype. Must be one of: ${validArchetypes.join(", ")}` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Find candidate by email
    const { data: candidate, error: findError } = await supabase
      .from("candidates")
      .select("id")
      .eq("email", candidate_email)
      .maybeSingle();

    if (findError) {
      throw findError;
    }

    if (!candidate) {
      // Log failed attempt
      await supabase.from("audit_log").insert({
        event_type: "dna_webhook_received",
        payload: { assessment_id, candidate_email, archetype, status: "candidate_not_found" },
      });

      return new Response(
        JSON.stringify({ error: "Candidate not found", candidate_email }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update candidate
    const { error: updateCandidateError } = await supabase
      .from("candidates")
      .update({ prescreening_complete: true })
      .eq("id", candidate.id);

    if (updateCandidateError) throw updateCandidateError;

    // Upsert prescreening_data
    const { error: upsertError } = await supabase
      .from("prescreening_data")
      .upsert(
        {
          candidate_id: candidate.id,
          tribe_viral_archetype: archetype.toLowerCase(),
          tribe_viral_scores: dimension_scores,
          completed_at: new Date().toISOString(),
        },
        { onConflict: "candidate_id" }
      );

    if (upsertError) throw upsertError;

    // Log success
    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_received",
      payload: {
        assessment_id,
        candidate_email,
        candidate_id: candidate.id,
        archetype,
        dimension_scores,
        status: "success",
      },
    });

    return new Response(
      JSON.stringify({ success: true, candidate_id: candidate.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Log error
    await supabase.from("audit_log").insert({
      event_type: "dna_webhook_received",
      payload: { assessment_id, candidate_email, archetype, status: "error", error: String(err) },
    }).catch(() => {});

    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
