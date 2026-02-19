import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { transitionPhase } from "@/utils/journeyEngine";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const PHASE_ORDER = ["screening", "interview", "offer", "pre_arrival", "onboarding", "probation"];
const PHASE_LABELS: Record<string, string> = {
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  pre_arrival: "Pre-Arrival",
  onboarding: "Onboarding",
  probation: "Probation",
};

interface PhaseTransitionButtonProps {
  journeyId: string;
  currentPhase: string;
  onTransitioned: () => void;
}

export function PhaseTransitionButton({ journeyId, currentPhase, onTransitioned }: PhaseTransitionButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  const nextPhase = currentIdx < PHASE_ORDER.length - 1 ? PHASE_ORDER[currentIdx + 1] : null;

  if (!nextPhase) return null;

  const handleTransition = async () => {
    setLoading(true);
    try {
      await transitionPhase(journeyId, nextPhase);
      toast({ title: "Phase transitioned", description: `Moved to ${PHASE_LABELS[nextPhase]}` });
      onTransitioned();
    } catch {
      toast({ title: "Failed to transition phase", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-success/10 border border-success/20">
      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-success">{PHASE_LABELS[currentPhase]} complete</p>
      </div>
      <Button size="sm" onClick={handleTransition} disabled={loading} className="gap-1.5">
        {loading ? "Moving..." : `Move to ${PHASE_LABELS[nextPhase]}`}
        <ArrowRight className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
