import { supabase } from "@/integrations/supabase/client";

export interface NotificationPayload {
  recipient_id: string;
  type: "buddy_assignment" | "candidate_update" | "stage_change";
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export async function sendInAppNotification(payload: NotificationPayload) {
  const { error } = await supabase.from("notifications").insert([{
    user_id: payload.recipient_id,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    link: payload.link,
    metadata: (payload.metadata ?? {}) as any,
    read: false,
  }]);

  if (error) {
    console.error("Failed to send in-app notification:", error);
    throw error;
  }

  return { success: true };
}

export async function sendSMSNotification(_phone: string, _message: string) {
  // TODO: Wire Twilio integration
  return { success: true, logged: true };
}

export async function sendWhatsAppNotification(_phone: string, _message: string) {
  // TODO: Wire WhatsApp Business API integration
  return { success: true, logged: true };
}
