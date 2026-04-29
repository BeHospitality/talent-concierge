import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Send, Activity, Shield, RefreshCw } from "lucide-react";
import { EmailPreviewDialog } from "./EmailPreviewDialog";
import { PathwayOverrideDialog, PATHWAY_OPTIONS, pathwayLabel } from "./PathwayOverrideDialog";
import { useCandidateAuditLog, type CareerAgentAuditRow } from "@/hooks/useCandidateAuditLog";

interface Props {
  candidate: {
    id: string;
    full_name: string;
    email: string;
    archetype?: string | null;
    current_journey_type?: string | null;
  };
}

const EMAIL_NAMES: Record<number, string> = {
  1: "Archetype Reveal",
  2: "Welcome to Concierge",
  3: "Profile Taking Shape",
  4: "Profile Ready",
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function summariseEvent(row: CareerAgentAuditRow): string {
  const p = row.payload || {};
  switch (row.event_type) {
    case "email_sent":
      return `Email #${p.email_number ?? "?"} sent (auto)`;
    case "email_sent_manual":
      return `Email #${p.email_number ?? "?"} sent (manual)${p.ok === false ? " — failed" : ""}`;
    case "email_skipped_status":
      return `Email #${p.email_number ?? "?"} skipped — status ${p.communication_status ?? "?"}`;
    case "email_skipped_recency":
      return `Email #${p.email_number ?? "?"} skipped — sent too recently`;
    case "pathway_overridden":
      return `Pathway: ${p.old_journey_type ?? "?"} → ${p.new_journey_type ?? "?"}`;
    default:
      return row.event_type;
  }
}

const FRIENDLY_TYPES: Record<string, string> = {
  email_sent: "Auto-send",
  email_sent_manual: "Manual send",
  email_skipped_status: "Skipped",
  email_skipped_recency: "Skipped (recency)",
  pathway_overridden: "Pathway change",
};

export function CareerAgentControls({ candidate }: Props) {
  const [previewEmail, setPreviewEmail] = useState<1 | 2 | 3 | 4 | null>(null);
  const [pathwayDraft, setPathwayDraft] = useState<string>(
    candidate.current_journey_type || "h2b_phase1_screening",
  );
  const [pathwayConfirmOpen, setPathwayConfirmOpen] = useState(false);

  const currentPathway = candidate.current_journey_type || "h2b_phase1_screening";
  useEffect(() => { setPathwayDraft(currentPathway); }, [currentPathway]);

  const { data: auditRows = [], refetch: refetchAudit } = useCandidateAuditLog(candidate.id);

  // Find last successful send per email number from audit_log (auto + manual).
  const lastSentByEmail = useMemo(() => {
    const map: Record<number, string> = {};
    for (const r of auditRows) {
      const num = r.payload?.email_number;
      if (typeof num !== "number") continue;
      if (r.event_type !== "email_sent" && r.event_type !== "email_sent_manual") continue;
      if (r.event_type === "email_sent_manual" && r.payload?.ok === false) continue;
      if (!map[num] || new Date(r.created_at) > new Date(map[num])) {
        map[num] = r.created_at;
      }
    }
    return map;
  }, [auditRows]);

  // Also pull last-sent from a broader audit query (auditRows is filtered to last 10
  // for this candidate; for sent-status indicators we want all-time). Lightweight extra query.
  const { data: allTimeSent = {} } = useQuery({
    queryKey: ["candidate_email_send_history", candidate.id],
    queryFn: async (): Promise<Record<number, string>> => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("created_at, event_type, payload")
        .in("event_type", ["email_sent", "email_sent_manual"])
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) return {};
      const map: Record<number, string> = {};
      for (const r of (data || []) as any[]) {
        if (r?.payload?.candidate_id !== candidate.id) continue;
        const num = r?.payload?.email_number;
        if (typeof num !== "number") continue;
        if (r.event_type === "email_sent_manual" && r.payload?.ok === false) continue;
        if (!map[num]) map[num] = r.created_at;
      }
      return map;
    },
    enabled: !!candidate.id,
    refetchOnWindowFocus: false,
  });

  const sentMap: Record<number, string | undefined> = {
    1: allTimeSent[1] ?? lastSentByEmail[1],
    2: allTimeSent[2] ?? lastSentByEmail[2],
    3: allTimeSent[3] ?? lastSentByEmail[3],
    4: allTimeSent[4] ?? lastSentByEmail[4],
  };

  const handleEmailSent = () => {
    refetchAudit();
  };

  const handlePathwaySaved = (newPathway: string) => {
    refetchAudit();
    // Optimistic local update; parent also re-fetches via React Query.
    candidate.current_journey_type = newPathway;
  };

  return (
    <div className="bg-card rounded-xl border-2 border-primary/30 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold">Career Agent Controls</h2>
        <Badge variant="outline" className="ml-auto text-[10px]">Admin only</Badge>
      </div>

      {/* Manual fire buttons */}
      <div>
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Manual Email Fires</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {[1, 2, 3, 4].map((n) => {
            const num = n as 1 | 2 | 3 | 4;
            const sentAt = sentMap[num];
            const sentDate = sentAt ? new Date(sentAt).toLocaleDateString() : null;
            return (
              <Button
                key={n}
                variant={sentAt ? "outline" : "default"}
                className="justify-start h-auto py-3"
                onClick={() => setPreviewEmail(num)}
              >
                <div className="flex items-center gap-2 w-full">
                  {sentAt ? <RefreshCw className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                  <div className="text-left">
                    <div className="text-sm font-medium">
                      {sentAt ? "Re-send" : "Send"} Email #{n} — {EMAIL_NAMES[n]}
                    </div>
                    {sentDate && (
                      <div className="text-[10px] text-muted-foreground">sent on {sentDate}</div>
                    )}
                  </div>
                </div>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Pathway override */}
      <div className="border-t border-border/50 pt-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Career Pathway</Label>
        <div className="flex flex-col md:flex-row gap-3 mt-2">
          <Select value={pathwayDraft} onValueChange={setPathwayDraft}>
            <SelectTrigger className="md:max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PATHWAY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            disabled={pathwayDraft === currentPathway}
            onClick={() => setPathwayConfirmOpen(true)}
          >
            Save Pathway Change
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Current: {pathwayLabel(currentPathway)}
        </p>
      </div>

      {/* Recent actions */}
      <div className="border-t border-border/50 pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-4 h-4 text-muted-foreground" />
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">
            Recent Career Agent Actions
          </Label>
        </div>
        {auditRows.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No actions recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {auditRows.map((row) => {
              const op = row.payload?.operator_user_id;
              return (
                <li key={row.id} className="text-xs flex items-start gap-3 p-2 rounded-md bg-muted/30">
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {FRIENDLY_TYPES[row.event_type] ?? row.event_type}
                  </Badge>
                  <div className="flex-1">
                    <p>{summariseEvent(row)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {relativeTime(row.created_at)} · {op ? `operator ${String(op).slice(0, 8)}…` : "system"}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {previewEmail !== null && (
        <EmailPreviewDialog
          emailNumber={previewEmail}
          candidate={{
            id: candidate.id,
            full_name: candidate.full_name,
            email: candidate.email,
            archetype: candidate.archetype ?? null,
          }}
          open={previewEmail !== null}
          onOpenChange={(open) => { if (!open) setPreviewEmail(null); }}
          onSent={handleEmailSent}
        />
      )}

      <PathwayOverrideDialog
        candidate={{
          id: candidate.id,
          email: candidate.email,
          current_journey_type: currentPathway,
        }}
        newPathway={pathwayDraft}
        open={pathwayConfirmOpen}
        onOpenChange={setPathwayConfirmOpen}
        onSaved={handlePathwaySaved}
      />
    </div>
  );
}
