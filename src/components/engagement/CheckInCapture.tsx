import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { completeEvent } from "@/utils/journeyHelpers";
import { useToast } from "@/hooks/use-toast";
import { Zap } from "lucide-react";
import {
  DAY_LABELS, MOOD_EMOJIS, MOOD_LABELS, CONFIDENCE_EMOJIS, CONFIDENCE_LABELS,
  TEAM_EMOJIS, TEAM_LABELS,
} from "@/utils/velocityScoring";

interface CheckInCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  candidateId: string;
  candidateName: string;
  journeyId: string;
  organizationId?: string | null;
  dayNumber: number;
  phase: string;
  onCompleted: () => void;
}

function EmojiScale({
  label,
  emojis,
  labels,
  value,
  onChange,
  required,
}: {
  label: string;
  emojis: string[];
  labels: string[];
  value: number | null;
  onChange: (v: number) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <div className="flex gap-2">
        {emojis.map((emoji, i) => {
          const val = i + 1;
          const selected = value === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => onChange(val)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all min-w-[56px] ${
                selected
                  ? "border-primary bg-primary/10 scale-105"
                  : "border-border/50 hover:border-border hover:bg-accent/30"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-[9px] text-muted-foreground leading-tight text-center">{labels[i]}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CheckInCapture({
  open, onOpenChange, eventId, eventTitle, candidateId, candidateName,
  journeyId, organizationId, dayNumber, phase, onCompleted,
}: CheckInCaptureProps) {
  const [mood, setMood] = useState<number | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [teamIntegration, setTeamIntegration] = useState<number | null>(null);
  const [concerns, setConcerns] = useState("");
  const [wins, setWins] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const dayInfo = DAY_LABELS[dayNumber] || { title: `Day ${dayNumber} Check-In`, subtitle: "How are they doing?" };
  const isCritical = dayInfo.critical;

  const handleSave = async () => {
    if (!mood) return;
    setLoading(true);
    try {
      // 1. Insert check-in
      const { error: insertError } = await supabase.from("engagement_checkins").insert({
        candidate_id: candidateId,
        journey_id: journeyId,
        journey_event_id: eventId,
        organization_id: organizationId,
        day_number: dayNumber,
        phase,
        mood,
        confidence,
        team_integration: teamIntegration,
        concerns: concerns || null,
        wins: wins || null,
        recorded_by: "manager",
      } as any);
      if (insertError) throw insertError;

      // 2. Mark event complete
      await completeEvent(eventId, undefined, `Check-in: mood=${mood}, confidence=${confidence}, team=${teamIntegration}`);

      // 3. Auto-alert on Day 3 critical failure
      if (dayNumber === 3 && mood <= 2) {
        await createUrgentAlert(candidateId, candidateName, journeyId, organizationId, mood, confidence, teamIntegration);
      }

      toast({ title: "Check-in saved", description: `${dayInfo.title} recorded for ${candidateName}` });
      onCompleted();
      onOpenChange(false);
      resetForm();
    } catch (e) {
      console.error("Check-in save failed:", e);
      toast({ title: "Failed to save check-in", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setMood(null);
    setConfidence(null);
    setTeamIntegration(null);
    setConcerns("");
    setWins("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base">{dayInfo.title}: {candidateName}</DialogTitle>
          <p className="text-xs text-muted-foreground">{dayInfo.subtitle}</p>
        </DialogHeader>

        {isCritical && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/30">
            <Zap className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-xs font-medium text-warning">Critical: 72-hour responses predict 90-day retention</p>
          </div>
        )}

        <div className="space-y-5 pt-2">
          <EmojiScale
            label="How is their mood?"
            emojis={MOOD_EMOJIS}
            labels={MOOD_LABELS}
            value={mood}
            onChange={setMood}
            required
          />

          <EmojiScale
            label="Confidence in role"
            emojis={CONFIDENCE_EMOJIS}
            labels={CONFIDENCE_LABELS}
            value={confidence}
            onChange={setConfidence}
          />

          <EmojiScale
            label="Team integration"
            emojis={TEAM_EMOJIS}
            labels={TEAM_LABELS}
            value={teamIntegration}
            onChange={setTeamIntegration}
          />

          <div className="space-y-2">
            <Label className="text-xs">Any concerns?</Label>
            <Textarea
              value={concerns}
              onChange={(e) => setConcerns(e.target.value)}
              placeholder="Flag any concerns..."
              className="bg-muted/50 text-sm min-h-[60px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Any wins to celebrate?</Label>
            <Textarea
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              placeholder="Positive moments..."
              className="bg-muted/50 text-sm min-h-[60px]"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={loading || !mood} className="gap-1.5">
            {loading ? "Saving..." : "Save Check-In ✓"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Auto-Alert for 72-hour velocity failure ────────────────
async function createUrgentAlert(
  candidateId: string,
  candidateName: string,
  journeyId: string,
  organizationId: string | null | undefined,
  mood: number,
  confidence: number | null,
  teamIntegration: number | null,
) {
  // Create urgent journey event
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 24);

  await supabase.from("journey_events").insert({
    journey_id: journeyId,
    organization_id: organizationId,
    phase: "onboarding",
    event_type: "alert",
    title: "⚡ 72-hour velocity alert — immediate intervention needed",
    description: `${candidateName} failed the 72-hour velocity check. Mood: ${mood}/5. Intervention needed within 24 hours.`,
    priority: "urgent",
    assigned_to: "manager",
    scheduled_for: deadline.toISOString(),
    status: "active",
  } as any);

  // Create notification (best effort — may not have a team_member user_id)
  // We'll skip notification insertion here as it requires a specific user_id
  console.log(`🔴 URGENT: ${candidateName} failed 72-hour velocity check`);
}
