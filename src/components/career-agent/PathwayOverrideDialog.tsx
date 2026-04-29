import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const PATHWAY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "h2b_phase1_screening", label: "H2B Phase 1: Screening (Florida route)" },
  { value: "h2b_phase2_onboarding", label: "H2B Phase 2: Onboarding" },
  { value: "direct_hire_screening", label: "Direct Hire: Screening" },
  { value: "executive_placement", label: "Executive Placement" },
];

export function pathwayLabel(value: string | null | undefined): string {
  return PATHWAY_OPTIONS.find((o) => o.value === value)?.label ?? (value || "—");
}

interface Props {
  candidate: { id: string; email: string; current_journey_type: string | null };
  newPathway: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (newPathway: string) => void;
}

export function PathwayOverrideDialog({ candidate, newPathway, open, onOpenChange, onSaved }: Props) {
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();

  const oldPathway = candidate.current_journey_type || "h2b_phase1_screening";

  const handleConfirm = async () => {
    setSaving(true);
    try {
      const { error: updErr } = await supabase
        .from("candidates")
        .update({ current_journey_type: newPathway })
        .eq("id", candidate.id);
      if (updErr) throw updErr;

      const { error: auditErr } = await supabase.from("audit_log").insert({
        event_type: "pathway_overridden",
        payload: {
          operator_user_id: user?.id ?? null,
          candidate_id: candidate.id,
          candidate_email: candidate.email,
          old_journey_type: oldPathway,
          new_journey_type: newPathway,
          reason: reason.trim() || null,
        },
      });
      if (auditErr) throw auditErr;

      toast.success(`Pathway updated to ${pathwayLabel(newPathway)}`);
      onSaved?.(newPathway);
      onOpenChange(false);
      setReason("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Pathway update failed: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!saving) onOpenChange(v); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change pathway?</DialogTitle>
          <DialogDescription>
            This update is logged to the audit trail with your operator ID.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md border border-border/50 bg-muted/30 p-3">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Transition</div>
            <p><span className="font-medium">{pathwayLabel(oldPathway)}</span> → <span className="font-semibold text-primary">{pathwayLabel(newPathway)}</span></p>
          </div>
          <div>
            <Label htmlFor="pathway-reason" className="text-xs">Reason (optional)</Label>
            <Textarea
              id="pathway-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this candidate being moved?"
              className="mt-1"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={saving}>
            {saving ? "Saving…" : "Confirm Change"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
