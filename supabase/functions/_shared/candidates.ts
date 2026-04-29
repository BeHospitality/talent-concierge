// Shared helpers for candidate lookup/insert + step log writes.
// Build #1C — Stage 2.

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export const BE_CONNECT_PORTAL_ORG_ID = "2deabbf5-6223-4c77-831c-b87b90d17ee6";

export const ALLOWED_JOURNEY_TYPES = [
  "h2b_phase1_screening",
  "h2b_phase2_placement",
  "h2b_phase3_arrival",
  "direct_hire",
  "internal_transfer",
];

export function makeServiceClient(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export function normaliseEmail(raw: unknown): string {
  return String(raw ?? "").toLowerCase().trim();
}

export interface ResolveCandidateResult {
  candidateId: string | null;
  organizationId: string | null;
  journeyType: string;
  created: boolean;
  communicationStatus: string;
  firstName: string | null;
  email: string;
}

/**
 * Look up a candidate by email; if missing, insert a minimal row anchored
 * to the Be Connect Portal holding org. Optionally bumps current_journey_type
 * if the inbound payload specifies a different (allowed) value.
 */
export async function resolveCandidate(
  supabase: SupabaseClient,
  email: string,
  opts: {
    firstName?: string | null;
    lastName?: string | null;
    inboundJourneyType?: string | null;
    referralSource?: string | null;
  } = {},
): Promise<ResolveCandidateResult> {
  const { data: existing } = await supabase
    .from("candidates")
    .select("id, organization_id, current_journey_type")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    let journeyType = existing.current_journey_type || "h2b_phase1_screening";
    if (
      opts.inboundJourneyType &&
      ALLOWED_JOURNEY_TYPES.includes(opts.inboundJourneyType) &&
      opts.inboundJourneyType !== journeyType
    ) {
      await supabase
        .from("candidates")
        .update({ current_journey_type: opts.inboundJourneyType })
        .eq("id", existing.id);
      journeyType = opts.inboundJourneyType;
    }
    return {
      candidateId: existing.id,
      organizationId: existing.organization_id,
      journeyType,
      created: false,
    };
  }

  const journeyType =
    opts.inboundJourneyType && ALLOWED_JOURNEY_TYPES.includes(opts.inboundJourneyType)
      ? opts.inboundJourneyType
      : "h2b_phase1_screening";

  const fullName =
    [opts.firstName, opts.lastName].filter(Boolean).join(" ").trim() ||
    email.split("@")[0];

  const { data: inserted, error } = await supabase
    .from("candidates")
    .insert({
      full_name: fullName,
      email,
      organization_id: BE_CONNECT_PORTAL_ORG_ID,
      current_stage: "pre_screening",
      current_journey_type: journeyType,
      communication_status: "manual_review",
      prescreening_complete: false,
      referral_source: opts.referralSource || "portal",
    })
    .select("id, organization_id, current_journey_type")
    .single();

  if (error || !inserted) {
    console.error("[resolveCandidate] insert failed:", error);
    return {
      candidateId: null,
      organizationId: BE_CONNECT_PORTAL_ORG_ID,
      journeyType,
      created: false,
    };
  }

  return {
    candidateId: inserted.id,
    organizationId: inserted.organization_id,
    journeyType: inserted.current_journey_type,
    created: true,
  };
}

export interface StepLogWrite {
  candidateEmail: string;
  candidateId: string | null;
  organizationId: string | null;
  journeyType: string;
  stepNumber: number;
  stepName: string;
  source: string;
  payload?: Record<string, unknown> | null;
  assessmentId?: string | null;
}

/**
 * Idempotent INSERT into candidate_step_log relying on the unique
 * (candidate_email, journey_type, step_number) constraint from Stage 1.
 */
export async function writeStepLog(
  supabase: SupabaseClient,
  w: StepLogWrite,
): Promise<{ id: string | null; deduped: boolean }> {
  const { data, error } = await supabase
    .from("candidate_step_log")
    .upsert(
      {
        candidate_email: w.candidateEmail,
        candidate_id: w.candidateId,
        organization_id: w.organizationId,
        assessment_id: w.assessmentId ?? null,
        journey_type: w.journeyType,
        step_number: w.stepNumber,
        step_name: w.stepName,
        source: w.source,
        payload: w.payload ?? null,
      },
      {
        onConflict: "candidate_email,journey_type,step_number",
        ignoreDuplicates: true,
      },
    )
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[writeStepLog] upsert failed:", error);
    throw error;
  }

  if (data?.id) {
    return { id: data.id, deduped: false };
  }

  // Duplicate ignored — fetch existing row id for response transparency.
  const { data: existing } = await supabase
    .from("candidate_step_log")
    .select("id")
    .eq("candidate_email", w.candidateEmail)
    .eq("journey_type", w.journeyType)
    .eq("step_number", w.stepNumber)
    .maybeSingle();

  return { id: existing?.id ?? null, deduped: true };
}
