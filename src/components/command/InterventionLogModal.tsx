import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const INTERVENTION_TYPES = [
  { value: "phone_call", label: "Phone Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "buddy_reassign", label: "Buddy Reassign" },
  { value: "role_change", label: "Role Change" },
  { value: "training_adjust", label: "Training Adjust" },
  { value: "escalation", label: "Escalation" },
  { value: "note", label: "Note" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateId: string;
  candidateName: string;
  organizationId: string | null;
  organizationName: string;
  journeyId: string | null;
  onLogged: () => void;
}

export function InterventionLogModal({
  open, onOpenChange, candidateId, candidateName, organizationId, organizationName, journeyId, onLogged,
}: Props) {
  const { user } = useAuth();
  const [type, setType] = useState("phone_call");
  const [summary, setSummary] = useState("");
  const [outcome, setOutcome] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!summary.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("interventions").insert({
      candidate_id: candidateId,
      organization_id: organizationId,
      journey_id: journeyId,
      intervention_type: type,
      summary: summary.trim(),
      outcome: outcome.trim() || null,
      follow_up_date: followUp || null,
      logged_by: user?.email || "admin",
    });
    setSaving(false);
    if (error) {
      toast.error("Failed to log intervention");
      return;
    }
    toast.success("Intervention logged");
    setSummary("");
    setOutcome("");
    setFollowUp("");
    onOpenChange(false);
    onLogged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Log Intervention</DialogTitle>
          <p className="text-sm text-muted-foreground">{organizationName} · {candidateName}</p>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {INTERVENTION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Summary</Label>
            <Textarea value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="What was done..." rows={3} />
          </div>
          <div>
            <Label>Outcome</Label>
            <Textarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="What happened as a result..." rows={2} />
          </div>
          <div>
            <Label>Follow-up date</Label>
            <Input type="date" value={followUp} onChange={(e) => setFollowUp(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={saving || !summary.trim()}>
              {saving ? "Logging..." : "Log Intervention ✓"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
