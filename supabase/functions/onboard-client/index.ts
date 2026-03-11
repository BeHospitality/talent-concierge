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

  try {
    const {
      org_code,
      property_name,
      contact_name,
      contact_email,
      contact_phone,
      vibe_check_responses,
      turnover_data,
      staff_count,
      annual_turnover_cost,
    } = await req.json();

    // Validate required fields
    if (!org_code || !property_name || !contact_email) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["org_code", "property_name", "contact_email"],
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Create or update organization
    // Note: organizations table has: org_code, organization_name, contact_name, contact_email,
    // contact_phone, status, annual_contract_value, notes — no onboarded_at or staff_count columns
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .upsert(
        {
          org_code,
          organization_name: property_name,
          contact_name: contact_name || "TBC",
          contact_email,
          contact_phone: contact_phone || null,
          status: "client",
          annual_contract_value: annual_turnover_cost || null,
          notes: staff_count
            ? `Staff count: ${staff_count}. Onboarded from Staff Audit on ${new Date().toISOString().slice(0, 10)}.`
            : `Onboarded from Staff Audit on ${new Date().toISOString().slice(0, 10)}.`,
        },
        { onConflict: "org_code", ignoreDuplicates: false }
      )
      .select()
      .single();

    if (orgError) {
      console.error("Organization creation error:", orgError);
      return new Response(
        JSON.stringify({ error: "Failed to create organization", details: orgError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Transfer Vibe Check responses as pulse_responses (if provided)
    // pulse_responses schema: organization_id, question_id (int), answer (jsonb),
    // respondent_name, department, submitted_at
    let vibeTransferred = 0;
    if (vibe_check_responses && Array.isArray(vibe_check_responses) && vibe_check_responses.length > 0) {
      const responses = vibe_check_responses.map((r: Record<string, unknown>, idx: number) => ({
        organization_id: org.id,
        question_id: idx + 1,
        answer: r, // store the entire vibe check response object as JSONB
        respondent_name: (r.respondent_name as string) || null,
        department: (r.department as string) || null,
        submitted_at: (r.submitted_at as string) || new Date().toISOString(),
      }));

      const { error: responseError } = await supabase
        .from("pulse_responses")
        .insert(responses);

      if (responseError) {
        console.warn("Some pulse responses failed to transfer:", responseError);
      } else {
        vibeTransferred = responses.length;
      }
    }

    // 3. Store turnover data in org_health_scores (if provided)
    // org_health_scores schema: organization_id, health_score, autonomy_score,
    // collaboration_score, communication_score, pace_score, leadership_score, key_friction_points
    if (turnover_data) {
      const { error: healthError } = await supabase
        .from("org_health_scores")
        .upsert(
          {
            organization_id: org.id,
            key_friction_points: turnover_data, // store raw turnover data as JSONB
          },
          { onConflict: "organization_id" }
        );

      if (healthError) {
        console.warn("Failed to store turnover data:", healthError);
      }
    }

    // 4. Log to audit trail
    await supabase
      .from("audit_log")
      .insert({
        event_type: "client_onboarded_from_staff_audit",
        payload: {
          org_code,
          property_name,
          vibe_check_count: vibe_check_responses?.length || 0,
          source: "staff_audit_conversion",
        },
      })
      .catch((err: unknown) => console.warn("Audit log failed:", err));

    console.log("Client onboarded successfully:", {
      org_code,
      property_name,
      vibe_check_responses: vibeTransferred,
    });

    return new Response(
      JSON.stringify({
        success: true,
        organization_id: org.id,
        org_code: org.org_code,
        message: "Client onboarded successfully",
        transferred: {
          organization: true,
          vibe_check_responses: vibeTransferred,
          turnover_data: !!turnover_data,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Onboard client error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
