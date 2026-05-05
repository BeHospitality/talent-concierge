import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type CareerAgentEventType =
  | "email_sent"
  | "email_sent_manual"
  | "email_skipped_status"
  | "email_skipped_recency"
  | "email_skipped_duplicate"
  | "email_failed"
  | "pathway_overridden";

export interface CareerAgentAuditRow {
  id: string;
  created_at: string;
  event_type: CareerAgentEventType;
  payload: any;
}

const RELEVANT_EVENTS: CareerAgentEventType[] = [
  "email_sent",
  "email_sent_manual",
  "email_skipped_status",
  "email_skipped_recency",
  "email_skipped_duplicate",
  "email_failed",
  "pathway_overridden",
];

/**
 * Fetches the most recent Career Agent–related audit_log events for a
 * single candidate. Filters client-side on the JSON payload's candidate_id.
 */
export function useCandidateAuditLog(candidateId: string | undefined) {
  return useQuery({
    queryKey: ["candidate_audit_log", candidateId],
    queryFn: async (): Promise<CareerAgentAuditRow[]> => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from("audit_log")
        .select("id, created_at, event_type, payload")
        .in("event_type", RELEVANT_EVENTS)
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      const filtered = (data || []).filter(
        (r: any) => r?.payload?.candidate_id === candidateId,
      );
      return filtered.slice(0, 10) as CareerAgentAuditRow[];
    },
    enabled: !!candidateId,
    refetchOnWindowFocus: false,
  });
}
