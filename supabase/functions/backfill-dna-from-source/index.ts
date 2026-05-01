// Stage 7E Mod 3 — Hub-side backfill caller.
// STAGED, NOT DEPLOYED. Awaiting DNA app endpoint URL + DNA_OUTBOUND_SECRET provisioning.
//
// Flow:
//  1. Authenticated admin invokes this function (verify_jwt = true by default).
//  2. Function selects all prescreening_data rows where dimension_scores IS NULL
//     and candidate_email IS NOT NULL.
//  3. POSTs the email list to the DNA app's read-only lookup endpoint
//     (URL configured via DNA_BACKFILL_ENDPOINT secret).
//  4. Auth: shared-secret header `x-dna-outbound-secret` containing
//     DNA_OUTBOUND_SECRET. This mirrors the existing inbound pattern
//     (x-dna-secret + DNA_INBOUND_SECRET, validated via timingSafeEqual
//     in supabase/functions/_shared/secrets.ts). The DNA app will validate
//     the same secret on its side.
//  5. For each returned record: defensively normalise to Title Case,
//     extract 5 primary dimensions into dimension_scores, store full
//     normalised blob into comprehensive_scores, and write one
//     dna_dimension_scores_backfill audit_log entry per candidate
//     with source: dna_app_assessments_table.
//
// IMPORTANT: this function is intentionally NOT listed in supabase/config.toml
// with verify_jwt = false. It must run authenticated (admin invocation).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EXPECTED_PRIMARY_DIMENSIONS = [
  "Adaptability",
  "Collaboration",
  "Autonomy",
  "Leadership",
  "Precision",
];

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function normaliseDimensionKeys(
  scores: Record<string, number> | null | undefined,
): Record<string, number> | null {
  if (!scores || typeof scores !== "object") return null;
  return Object.fromEntries(
    Object.entries(scores).map(([k, v]) => [titleCase(k), v]),
  );
}

function extractPrimary(
  normalised: Record<string, number>,
): Record<string, number> | null {
  const present = EXPECTED_PRIMARY_DIMENSIONS.filter((k) => k in normalised);
  if (present.length !== 5) return null;
  return Object.fromEntries(
    EXPECTED_PRIMARY_DIMENSIONS.map((k) => [k, normalised[k]]),
  );
}

interface DnaSourceRecord {
  email: string;
  dimension_scores?: Record<string, number> | null;
  comprehensive_scores?: Record<string, number> | null;
  archetype?: string | null;
  completed_at?: string | null;
  assessment_id?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const dnaEndpoint = Deno.env.get("DNA_BACKFILL_ENDPOINT");
  const outboundSecret = Deno.env.get("DNA_OUTBOUND_SECRET");

  if (!dnaEndpoint || !outboundSecret) {
    return new Response(
      JSON.stringify({
        error: "Server misconfigured: DNA_BACKFILL_ENDPOINT and DNA_OUTBOUND_SECRET required",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    // 1. Collect candidates needing backfill.
    const { data: targets, error: selectErr } = await supabase
      .from("prescreening_data")
      .select("id, candidate_email, candidate_id")
      .is("dimension_scores", null)
      .not("candidate_email", "is", null);

    if (selectErr) throw selectErr;

    const emails = (targets ?? [])
      .map((r) => r.candidate_email as string)
      .filter((e) => e && e.length > 0);

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ ok: true, message: "Nothing to backfill", processed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Call DNA app read endpoint.
    const dnaResp = await fetch(dnaEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-dna-outbound-secret": outboundSecret,
      },
      body: JSON.stringify({ emails }),
    });

    if (!dnaResp.ok) {
      const text = await dnaResp.text();
      return new Response(
        JSON.stringify({ error: "DNA app lookup failed", status: dnaResp.status, body: text }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const records: DnaSourceRecord[] = await dnaResp.json();

    // 3. Apply per record.
    const results: Array<{ email: string; status: string; reason?: string }> = [];

    for (const rec of records) {
      const email = rec.email;
      if (!email) {
        results.push({ email: "(missing)", status: "skipped", reason: "no_email" });
        continue;
      }

      // Defensive normalisation — DNA endpoint may emit lowercase.
      const sourceBlob = rec.comprehensive_scores ?? rec.dimension_scores ?? null;
      const normalised = normaliseDimensionKeys(sourceBlob);
      if (!normalised) {
        results.push({ email, status: "skipped", reason: "no_scores_in_source" });
        continue;
      }

      const primary = extractPrimary(normalised);
      if (!primary) {
        results.push({ email, status: "skipped", reason: "primary_dimensions_incomplete" });
        // Still log a shape mismatch for visibility.
        await supabase.from("audit_log").insert({
          event_type: "dna_webhook_shape_mismatch",
          payload: {
            candidate_email: email,
            source: "dna_app_assessments_table_backfill",
            incoming_keys: Object.keys(normalised),
          },
        });
        continue;
      }

      const { error: updErr } = await supabase
        .from("prescreening_data")
        .update({
          dimension_scores: primary,
          comprehensive_scores: normalised,
        })
        .eq("candidate_email", email);

      if (updErr) {
        results.push({ email, status: "failed", reason: updErr.message });
        continue;
      }

      await supabase.from("audit_log").insert({
        event_type: "dna_dimension_scores_backfill",
        payload: {
          candidate_email: email,
          source: "dna_app_assessments_table",
          normalised_to: "title_case",
          primary_keys_extracted: 5,
          comprehensive_keys_stored: Object.keys(normalised).length,
          assessment_id: rec.assessment_id ?? null,
          completed_at: rec.completed_at ?? null,
        },
      });

      results.push({ email, status: "ok" });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        requested: emails.length,
        returned: records.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("[backfill-dna-from-source] ERROR:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
