// Shared Brevo transactional email helper.
// Build #1C — Stage 3 + Fix 1.5/1.6 (audit standardisation).

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export type EmailTriggerSource = "auto" | "manual" | "cron" | "system";

export interface BrevoSendResult {
  ok: boolean;
  messageId?: string;
  status?: number;
  error?: string;
}

/**
 * Standardised audit envelope used across every email-related event so that
 * downstream observability (Career Agent timeline, DUP-01 detection, SEQ-01
 * recency analysis) can rely on a consistent field set.
 */
function buildAuditEnvelope(args: {
  templateKey: string;
  candidateId: string | null;
  candidateEmail?: string | null;
  sourceEndpoint: string;
  emailNumber: number;
  triggerSource: EmailTriggerSource;
  communicationStatus?: string | null;
  operatorUserId?: string | null;
  wasSkipped: boolean;
  skipReason?: string | null;
  extra?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    endpoint: args.sourceEndpoint,
    template_key: args.templateKey,
    email_number: args.emailNumber,
    candidate_id: args.candidateId,
    candidate_email: args.candidateEmail ?? null,
    trigger_source: args.triggerSource,
    communication_status_at_fire_time: args.communicationStatus ?? null,
    operator_user_id: args.operatorUserId ?? null,
    was_skipped: args.wasSkipped,
    skip_reason: args.skipReason ?? null,
    ...(args.extra ?? {}),
  };
}

/**
 * Looks up the Brevo template registration by key, then sends a transactional
 * email via Brevo's SMTP API. Logs success/failure to audit_log with the
 * standard envelope. Email failures NEVER throw.
 */
export async function sendTransactionalEmail(
  supabase: SupabaseClient,
  args: {
    templateKey: string;
    recipientEmail: string;
    mergeParams: Record<string, unknown>;
    candidateId: string | null;
    sourceEndpoint: string;
    emailNumber: number;
    triggerSource?: EmailTriggerSource;
    communicationStatus?: string | null;
    operatorUserId?: string | null;
  },
): Promise<BrevoSendResult> {
  const triggerSource: EmailTriggerSource = args.triggerSource ?? "auto";
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    await safeAudit(supabase, "email_failed", buildAuditEnvelope({
      templateKey: args.templateKey,
      candidateId: args.candidateId,
      candidateEmail: args.recipientEmail,
      sourceEndpoint: args.sourceEndpoint,
      emailNumber: args.emailNumber,
      triggerSource,
      communicationStatus: args.communicationStatus,
      operatorUserId: args.operatorUserId,
      wasSkipped: false,
      extra: { reason: "BREVO_API_KEY not configured" },
    }));
    return { ok: false, error: "BREVO_API_KEY missing" };
  }

  const { data: tpl, error: tplErr } = await supabase
    .from("brevo_templates")
    .select("brevo_template_id, sender_name, sender_email, reply_to_email")
    .eq("template_key", args.templateKey)
    .maybeSingle();

  if (tplErr || !tpl) {
    await safeAudit(supabase, "email_failed", buildAuditEnvelope({
      templateKey: args.templateKey,
      candidateId: args.candidateId,
      candidateEmail: args.recipientEmail,
      sourceEndpoint: args.sourceEndpoint,
      emailNumber: args.emailNumber,
      triggerSource,
      communicationStatus: args.communicationStatus,
      operatorUserId: args.operatorUserId,
      wasSkipped: false,
      extra: { reason: "template not found in registry" },
    }));
    return { ok: false, error: "template not registered" };
  }

  const flatParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(args.mergeParams ?? {})) {
    if (v === undefined || v === null) continue;
    flatParams[k] = typeof v === "string" ? v : String(v);
  }

  const payload = {
    templateId: tpl.brevo_template_id,
    to: [{ email: args.recipientEmail }],
    sender: { name: tpl.sender_name, email: tpl.sender_email },
    replyTo: { email: tpl.reply_to_email },
    params: flatParams,
  };

  try {
    const res = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "content-type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const txt = await res.text();
    let json: any = {};
    try { json = JSON.parse(txt); } catch { /* keep as text */ }

    if (!res.ok) {
      const sanitised = (json?.message || json?.code || `HTTP ${res.status}`)
        .toString()
        .slice(0, 300);
      await safeAudit(supabase, "email_failed", buildAuditEnvelope({
        templateKey: args.templateKey,
        candidateId: args.candidateId,
        candidateEmail: args.recipientEmail,
        sourceEndpoint: args.sourceEndpoint,
        emailNumber: args.emailNumber,
        triggerSource,
        communicationStatus: args.communicationStatus,
        operatorUserId: args.operatorUserId,
        wasSkipped: false,
        extra: { reason: sanitised, status: res.status },
      }));
      return { ok: false, status: res.status, error: sanitised };
    }

    const messageId = json?.messageId || json?.messageIds?.[0] || null;
    // event_type stays differentiated for backward-compat with the
    // useCandidateAuditLog hook (filters on email_sent vs email_sent_manual).
    const eventType = triggerSource === "manual"
      ? "email_sent_manual"
      : "email_sent";
    await safeAudit(supabase, eventType, buildAuditEnvelope({
      templateKey: args.templateKey,
      candidateId: args.candidateId,
      candidateEmail: args.recipientEmail,
      sourceEndpoint: args.sourceEndpoint,
      emailNumber: args.emailNumber,
      triggerSource,
      communicationStatus: args.communicationStatus,
      operatorUserId: args.operatorUserId,
      wasSkipped: false,
      extra: { brevo_message_id: messageId, ok: true },
    }));
    return { ok: true, messageId, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await safeAudit(supabase, "email_failed", buildAuditEnvelope({
      templateKey: args.templateKey,
      candidateId: args.candidateId,
      candidateEmail: args.recipientEmail,
      sourceEndpoint: args.sourceEndpoint,
      emailNumber: args.emailNumber,
      triggerSource,
      communicationStatus: args.communicationStatus,
      operatorUserId: args.operatorUserId,
      wasSkipped: false,
      extra: { reason: msg.slice(0, 300) },
    }));
    return { ok: false, error: msg };
  }
}

export async function logEmailSkipped(
  supabase: SupabaseClient,
  args: {
    templateKey: string;
    candidateId: string | null;
    candidateEmail?: string | null;
    sourceEndpoint: string;
    emailNumber: number;
    status: string;
    reason: string;
    triggerSource?: EmailTriggerSource;
    operatorUserId?: string | null;
    eventType?: string; // override (e.g. "email_skipped_recency", "email_skipped_duplicate")
  },
): Promise<void> {
  await safeAudit(
    supabase,
    args.eventType ?? "email_skipped_status",
    buildAuditEnvelope({
      templateKey: args.templateKey,
      candidateId: args.candidateId,
      candidateEmail: args.candidateEmail,
      sourceEndpoint: args.sourceEndpoint,
      emailNumber: args.emailNumber,
      triggerSource: args.triggerSource ?? "auto",
      communicationStatus: args.status,
      operatorUserId: args.operatorUserId,
      wasSkipped: true,
      skipReason: args.reason,
    }),
  );
}

async function safeAudit(
  supabase: SupabaseClient,
  event_type: string,
  payload: Record<string, unknown>,
): Promise<void> {
  try {
    await supabase.from("audit_log").insert({ event_type, payload });
  } catch (e) {
    console.error(`[audit] ${event_type} failed:`, e);
  }
}

/**
 * Format an array of step strings into a friendly bullet list for email merge.
 */
export function formatStepList(items: unknown[]): string {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items
    .map((i) => `• ${String(i)}`)
    .join("\n");
}

/**
 * DUP-01 guard. Returns the most recent successful send (email_sent or
 * email_sent_manual) for this candidate + email_number within the given
 * window in minutes, or null if none. Callers use this to suppress
 * accidental duplicate fires (e.g. operator double-click, concurrent
 * cron + manual fire).
 */
export async function getRecentSendWithinWindow(
  supabase: SupabaseClient,
  args: {
    candidateId: string;
    emailNumber: number;
    windowMinutes: number;
  },
): Promise<{ id: string; created_at: string; event_type: string; payload: any } | null> {
  const since = new Date(Date.now() - args.windowMinutes * 60_000).toISOString();
  const { data, error } = await supabase
    .from("audit_log")
    .select("id, created_at, event_type, payload")
    .in("event_type", ["email_sent", "email_sent_manual"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error || !data) return null;
  const match = data.find((r: any) =>
    r?.payload?.candidate_id === args.candidateId &&
    Number(r?.payload?.email_number) === args.emailNumber
  );
  return match ?? null;
}
