import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { JourneyEventNode } from "./JourneyEventNode";

interface JourneyEvent {
  id: string;
  journey_id?: string | null;
  phase: string;
  event_type: string;
  title: string;
  description: string | null;
  day_offset: number | null;
  scheduled_for: string | null;
  completed_at: string | null;
  status: string;
  assigned_to: string | null;
  priority: string | null;
}

const PHASE_LABELS: Record<string, string> = {
  screening: "Screening",
  interview: "Interview",
  offer: "Offer",
  pre_arrival: "Pre-Arrival",
  onboarding: "Onboarding",
  probation: "Probation",
};

const PHASE_ICONS: Record<string, string> = {
  screening: "🔍",
  interview: "🎤",
  offer: "📄",
  pre_arrival: "✈️",
  onboarding: "🍞",
  probation: "📊",
};

interface JourneyPhaseSectionProps {
  phase: string;
  events: JourneyEvent[];
  isCurrent: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  candidateId?: string;
  candidateName?: string;
  organizationId?: string | null;
  onEventCompleted: () => void;
}

export function JourneyPhaseSection({ phase, events, isCurrent, isCompleted, isFuture, candidateId, candidateName, organizationId, onEventCompleted }: JourneyPhaseSectionProps) {
  const [expanded, setExpanded] = useState(isCurrent);

  const completedCount = events.filter((e) => e.status === "completed").length;
  const totalCount = events.length;

  const borderColor = isCurrent
    ? "border-l-primary"
    : isCompleted
    ? "border-l-success"
    : "border-l-border/30";

  const label = isCurrent ? "Current" : isCompleted ? `${completedCount}/${totalCount} done` : "Upcoming";

  return (
    <div className={`border-l-2 ${borderColor} pl-4 mb-4`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">{PHASE_ICONS[phase] || "📌"}</span>
          <h3 className={`text-sm font-semibold uppercase tracking-wider ${
            isCurrent ? "text-primary" : isCompleted ? "text-success" : "text-muted-foreground"
          }`}>
            {PHASE_LABELS[phase] || phase}
          </h3>
          {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-success" />}
          <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted/50">
            {label}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1 pb-2">
              {events
                .sort((a, b) => {
                  const aOverdue = a.status === "pending" && a.scheduled_for && new Date(a.scheduled_for) < new Date();
                  const bOverdue = b.status === "pending" && b.scheduled_for && new Date(b.scheduled_for) < new Date();
                  if (aOverdue && !bOverdue) return -1;
                  if (!aOverdue && bOverdue) return 1;
                  return (a.day_offset ?? 0) - (b.day_offset ?? 0);
                })
                .map((event) => (
                  <JourneyEventNode
                    key={event.id}
                    event={event}
                    isCurrentPhase={isCurrent}
                    candidateId={candidateId}
                    candidateName={candidateName}
                    organizationId={organizationId}
                    onCompleted={onEventCompleted}
                  />
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
