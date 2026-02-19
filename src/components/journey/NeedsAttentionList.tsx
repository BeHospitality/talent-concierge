import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle2, Eye } from "lucide-react";
import { CompleteEventModal } from "./CompleteEventModal";
import type { AttentionEvent } from "@/hooks/useJourneyDashboard";

const PHASE_LABELS: Record<string, string> = {
  screening: "Screening", interview: "Interview", offer: "Offer",
  pre_arrival: "Pre-Arrival", onboarding: "Onboarding", probation: "Probation",
};

interface Props {
  events: AttentionEvent[];
  onCompleted: () => void;
}

export function NeedsAttentionList({ events, onCompleted }: Props) {
  const navigate = useNavigate();
  const [completeModal, setCompleteModal] = useState<{ id: string; title: string } | null>(null);

  if (events.length === 0) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center mb-6">
        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="text-sm font-medium text-success">All caught up! No overdue or due-today events.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Needs Attention ({events.length})
      </h2>
      <div className="bg-card rounded-xl border border-destructive/20 divide-y divide-border/50 overflow-hidden">
        {events.map((e) => (
          <div key={e.id} className="flex items-center justify-between p-4 gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="font-semibold text-sm truncate">{e.candidate?.full_name || "Unknown"}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                  {PHASE_LABELS[e.journey_phase] || e.journey_phase}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                "{e.title}" — {e.days_overdue > 0 ? (
                  <span className="text-destructive font-medium">{e.days_overdue} day{e.days_overdue !== 1 ? "s" : ""} overdue</span>
                ) : (
                  <span className="text-warning font-medium">Due today</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setCompleteModal({ id: e.id, title: e.title })}>
                <CheckCircle2 className="w-3 h-3" /> Complete
              </Button>
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => navigate(`/candidate/${e.candidate?.id}`)}>
                <Eye className="w-3 h-3" /> View
              </Button>
            </div>
          </div>
        ))}
      </div>
      {completeModal && (
        <CompleteEventModal
          open={!!completeModal}
          onOpenChange={() => setCompleteModal(null)}
          eventId={completeModal.id}
          eventTitle={completeModal.title}
          onCompleted={onCompleted}
        />
      )}
    </div>
  );
}
