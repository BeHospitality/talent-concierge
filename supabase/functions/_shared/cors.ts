// Shared CORS headers for inbound webhook endpoints.
// Build #1C — Stage 2.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-dna-secret, x-portal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
