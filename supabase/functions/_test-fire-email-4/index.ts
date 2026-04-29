// One-shot internal tester for fire-email-4. NOT for production use.
// Triggers fire-email-4 with the platform service-role key.

Deno.serve(async (req) => {
  const body = await req.json().catch(() => ({}));
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fire-email-4`;
  const sr = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sr}`,
      "apikey": sr,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  return new Response(JSON.stringify({ status: res.status, body: text }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});
