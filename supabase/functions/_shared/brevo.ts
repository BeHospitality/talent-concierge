// Shared Brevo transactional email helper.
// Build #1C — Stage 3.

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export interface BrevoSendResult {
  ok: boolean;
  messageId?: string;
  status?: number;
  error?: string;
}

/**
 * Looks up the Brevo template registration by key, then sends a transactional
 * email via Brevo's SMTP API. Logs success/failure to audit_log.
 *
 * Email send failures NEVER throw — callers treat email as best-effort and
 * the inbound webhook still returns 200 on a successful step_log write.
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
  },
): Promise<BrevoSendResult> {
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) {
    await safeAudit(supabase, "email_failed", {
      reason: "BREVO_API_KEY not configured",
      template_key: args.templateKey,
      candidate_id: args.candidateId,
      endpoint: args.sourceEndpoint,
      email_number: args.emailNumber,
    });
    return { ok: false, error: "BREVO_API_KEY missing" };
  }

  const { data: tpl, error: tplErr } = await supabase
    .from("brevo_templates")
    .select("brevo_template_id, sender_name, sender_email, reply_to_email")
    .eq("template_key", args.templateKey)
    .maybeSingle();

  if (tplErr || !tpl) {
    await safeAudit(supabase, "email_failed", {
      reason: "template not found in registry",
      template_key: args.templateKey,
      candidate_id: args.candidateId,
      endpoint: args.sourceEndpoint,
      email_number: args.emailNumber,
    });
    return { ok: false, error: "template not registered" };
  }

  const payload = {
    templateId: tpl.brevo_template_id,
    to: [{ email: args.recipientEmail }],
    sender: { name: tpl.sender_name, email: tpl.sender_email },
    replyTo: { email: tpl.reply_to_email },
    params: args.mergeParams,
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
      // Sanitised error — never log raw response (may echo headers/keys back).
      const sanitised = (json?.message || json?.code || `HTTP ${res.status}`)
        .toString()
        .slice(0, 300);
      await safeAudit(supabase, "email_failed", {
        reason: sanitised,
        status: res.status,
        template_key: args.templateKey,
        candidate_id: args.candidateId,
        endpoint: args.sourceEndpoint,
        email_number: args.emailNumber,
      });
      return { ok: false, status: res.status, error: sanitised };
    }

    const messageId = json?.messageId || json?.messageIds?.[0] || null;
    await safeAudit(supabase, "email_sent", {
      brevo_message_id: messageId,
      template_key: args.templateKey,
      candidate_id: args.candidateId,
      endpoint: args.sourceEndpoint,
      email_number: args.emailNumber,
      recipient_email: args.recipientEmail,
    });
    return { ok: true, messageId, status: res.status };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await safeAudit(supabase, "email_failed", {
      reason: msg.slice(0, 300),
      template_key: args.templateKey,
      candidate_id: args.candidateId,
      endpoint: args.sourceEndpoint,
      email_number: args.emailNumber,
    });
    return { ok: false, error: msg };
  }
}

export async function logEmailSkipped(
  supabase: SupabaseClient,
  args: {
    templateKey: string;
    candidateId: string | null;
    sourceEndpoint: string;
    emailNumber: number;
    status: string;
    reason: string;
  },
): Promise<void> {
  await safeAudit(supabase, "email_skipped_status", {
    template_key: args.templateKey,
    candidate_id: args.candidateId,
    endpoint: args.sourceEndpoint,
    email_number: args.emailNumber,
    communication_status: args.status,
    reason: args.reason,
  });
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
