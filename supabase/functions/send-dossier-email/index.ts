import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }

    const {
      to_email,
      to_name,
      candidate_name,
      candidate_archetype,
      dossier_url,
      pin_code,
      personal_message,
      sender_name,
      organization_name,
      includes_resume,
    } = await req.json();

    if (!to_email || !to_name || !candidate_name || !dossier_url || !pin_code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const archetypeDisplay = candidate_archetype
      ? `${candidate_archetype.charAt(0).toUpperCase()}${candidate_archetype.slice(1)}`
      : "Not assessed";

    const resumeLine = includes_resume ? "\n    • CV/Resume" : "";
    const messageLine = personal_message
      ? `\n\nPersonal Note:\n${personal_message}`
      : "";

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f8f9fa;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
      <!-- Header -->
      <div style="background:#1a1a2e;padding:32px 32px 24px;text-align:center;">
        <div style="width:48px;height:48px;background:#c9a84c;border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="color:#1a1a2e;font-weight:bold;font-size:20px;">B</span>
        </div>
        <h1 style="color:#ffffff;font-size:22px;margin:0 0 4px;">Candidate Profile</h1>
        <p style="color:#9ca3af;font-size:14px;margin:0;">${candidate_name}</p>
      </div>

      <!-- Body -->
      <div style="padding:32px;">
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Hi ${to_name},
        </p>
        <p style="color:#374151;font-size:15px;line-height:1.6;margin:0 0 24px;">
          ${sender_name || "Your recruiter"}${organization_name ? ` from ${organization_name}` : ""} has shared a candidate profile with you for review.
        </p>

        <!-- Candidate card -->
        <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;width:120px;">Candidate</td>
              <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">${candidate_name}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;color:#6b7280;font-size:13px;">Archetype</td>
              <td style="padding:4px 0;color:#111827;font-size:14px;font-weight:600;">${archetypeDisplay}</td>
            </tr>
          </table>
        </div>

        <!-- Access details -->
        <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:20px;margin-bottom:24px;text-align:center;">
          <p style="color:#92400e;font-size:13px;margin:0 0 12px;font-weight:600;">ACCESS DETAILS</p>
          <p style="color:#374151;font-size:13px;margin:0 0 8px;">
            <a href="${dossier_url}" style="color:#c9a84c;font-weight:600;text-decoration:underline;">${dossier_url}</a>
          </p>
          <p style="color:#374151;font-size:13px;margin:0;">
            PIN: <span style="font-family:monospace;font-size:18px;font-weight:bold;letter-spacing:4px;color:#1a1a2e;">${pin_code}</span>
          </p>
        </div>

        ${personal_message ? `
        <div style="background:#f0f9ff;border-left:3px solid #3b82f6;padding:16px;margin-bottom:24px;border-radius:0 8px 8px 0;">
          <p style="color:#6b7280;font-size:12px;margin:0 0 4px;font-weight:600;">PERSONAL NOTE</p>
          <p style="color:#374151;font-size:14px;line-height:1.5;margin:0;">${personal_message}</p>
        </div>
        ` : ""}

        <p style="color:#6b7280;font-size:13px;line-height:1.6;margin:0 0 8px;">
          The dossier includes:
        </p>
        <ul style="color:#6b7280;font-size:13px;line-height:1.8;margin:0 0 24px;padding-left:20px;">
          <li>DNA Career Profile & Archetype</li>
          <li>Skills & Dimension Scores</li>
          <li>Sector/Geography/Department Fit</li>
          <li>Career Trajectory Predictions</li>
          ${includes_resume ? "<li>CV/Resume</li>" : ""}
        </ul>

        <p style="color:#9ca3af;font-size:12px;margin:0;">
          This link expires in 30 days. If you have questions, please contact your recruiter.
        </p>
      </div>

      <!-- Footer -->
      <div style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 32px;text-align:center;">
        <p style="color:#9ca3af;font-size:11px;margin:0;">
          Powered by Be Connect · GDPR Compliant · Confidential
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const textContent = `Hi ${to_name},

${sender_name || "Your recruiter"}${organization_name ? ` from ${organization_name}` : ""} has shared a candidate profile with you.

Candidate: ${candidate_name}
Archetype: ${archetypeDisplay}

View the complete dossier:
Link: ${dossier_url}
PIN: ${pin_code}
${messageLine}

The dossier includes:
    • DNA Career Profile & Archetype
    • Skills & Dimension Scores
    • Sector/Geography/Department Fit
    • Career Trajectory Predictions${resumeLine}

This link expires in 30 days.

Best regards,
${sender_name || "Be Connect Team"}
Be Connect`;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Be Connect", email: "dossiers@beconnect.ie" },
        to: [{ email: to_email, name: to_name }],
        subject: `Candidate Profile – ${candidate_name}`,
        htmlContent,
        textContent,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Brevo API failed [${response.status}]: ${errorBody}`);
    }

    const result = await response.json();

    return new Response(
      JSON.stringify({ success: true, messageId: result.messageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error sending dossier email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
