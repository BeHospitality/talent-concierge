import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const email = body.email || body.candidate_email;

    if (!email) {
      return new Response(
        JSON.stringify({ error: "email required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tierMap: Record<string, string> = {
      starting: "Starting Out",
      growing: "Growing",
      returning: "Returning",
      advancing: "Advancing",
    };

    const record = {
      candidate_email: email,
      archetype_type: body.archetype_type || null,
      tribe_viral_archetype: body.archetype
        ? body.archetype.toLowerCase()
        : null,
      tribe_viral_scores: body.scores || null,
      dimension_scores: body.scores || null,
      matching_results: body.matching_results || null,
      candidate_tier: tierMap[body.path] || null,
      dna_path: body.path || null,
      dna_session_id: body.session_id || null,
      dna_source: body.source || "dna-assessment",
      completed_at: body.completed_at || new Date().toISOString(),
    };

    // Check if row exists
    const { data: existing } = await supabase
      .from("prescreening_data")
      .select("id")
      .eq("candidate_email", email)
      .maybeSingle();

    let result;
    if (existing) {
      // Update existing row
      const { data, error } = await supabase
        .from("prescreening_data")
        .update(record)
        .eq("candidate_email", email)
        .select()
        .single();
      if (error) throw error;
      result = data;
    } else {
      // Insert new row
      const { data, error } = await supabase
        .from("prescreening_data")
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      result = data;
    }

    await supabase.from("audit_log").insert({
      event_type: "dna_candidate_received",
      payload: {
        email,
        archetype: body.archetype,
        tier: tierMap[body.path] || null,
        path: body.path,
        source: body.source,
        record_id: result?.id,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        id: result?.id,
        email,
        archetype: body.archetype,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[dna-webhook] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
