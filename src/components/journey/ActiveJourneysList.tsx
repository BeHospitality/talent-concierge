import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { differenceInDays } from "date-fns";
import { VelocityBadge } from "@/components/engagement/VelocityBadge";
import { useVelocityForCandidate } from "@/hooks/useEngagementCheckins";
import type { JourneyWithDetails } from "@/hooks/useJourneyDashboard";

const PHASE_COLOURS: Record<string, { bg: string; text: string; label: string }> = {
  screening: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Screening" },
  interview: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Interview" },
  offer: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Offer" },
  pre_arrival: { bg: "bg-cyan-500/10", text: "text-cyan-400", label: "Pre-Arrival" },
  onboarding: { bg: "bg-green-500/10", text: "text-green-400", label: "Onboarding" },
  probation: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Probation" },
};

interface Props {
  journeys: JourneyWithDetails[];
}

type SortOption = "recent" | "overdue" | "newest" | "oldest" | "at_risk";

export function ActiveJourneysList({ journeys }: Props) {
  const navigate = useNavigate();
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("recent");

  const filtered = useMemo(() => {
    let list = phaseFilter === "all" ? journeys : journeys.filter((j) => j.current_phase === phaseFilter);

    return [...list].sort((a, b) => {
      if (sortBy === "overdue") {
        const aOver = a.journey_events.filter((e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < new Date()).length;
        const bOver = b.journey_events.filter((e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < new Date()).length;
        return bOver - aOver;
      }
      if (sortBy === "newest") return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      if (sortBy === "oldest") return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
    });
  }, [journeys, phaseFilter, sortBy]);

  if (journeys.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No active journeys yet.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
          All Active Journeys ({filtered.length})
        </h2>
        <div className="flex gap-2">
          <Select value={phaseFilter} onValueChange={setPhaseFilter}>
            <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              {Object.entries(PHASE_COLOURS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Most Recent</SelectItem>
              <SelectItem value="overdue">Most Overdue</SelectItem>
              <SelectItem value="at_risk">Most At Risk</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden">
        {filtered.map((j, i) => {
          const phaseEvents = j.journey_events.filter((e) => e.phase === j.current_phase);
          const completed = phaseEvents.filter((e) => e.status === "completed").length;
          const total = phaseEvents.length;
          const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
          const now = new Date();
          const overdueCount = j.journey_events.filter(
            (e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < now
          ).length;
          const nextEvent = j.journey_events
            .filter((e) => (e.status === "pending" || e.status === "active") && e.scheduled_for)
            .sort((a, b) => new Date(a.scheduled_for!).getTime() - new Date(b.scheduled_for!).getTime())[0];

          const phase = PHASE_COLOURS[j.current_phase] || { bg: "bg-muted", text: "text-muted-foreground", label: j.current_phase };

          let dayLabel = "";
          if (j.start_work_date) {
            const diff = differenceInDays(now, new Date(j.start_work_date));
            if (["onboarding", "probation"].includes(j.current_phase)) {
              dayLabel = `Day ${diff}`;
            } else if (j.current_phase === "pre_arrival") {
              dayLabel = `Day ${diff < 0 ? diff : `-${diff}`}`;
            }
          }

          return (
            <motion.div
              key={j.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/candidate/${j.candidate_id}`)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-semibold text-sm truncate">{j.candidates?.full_name || "Unknown"}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${phase.bg} ${phase.text}`}>
                      {phase.label}
                    </span>
                    {dayLabel && (
                      <span className="text-[10px] font-medium text-muted-foreground">{dayLabel}</span>
                    )}
                    <JourneyVelocityBadge candidateId={j.candidate_id} phase={j.current_phase} />
                    {overdueCount > 0 && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-destructive">
                        <AlertTriangle className="w-3 h-3" /> {overdueCount} overdue
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mb-1">
                    <Progress value={pct} className="h-1.5 flex-1 max-w-[200px]" />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{completed}/{total}</span>
                  </div>
                  {nextEvent && (
                    <p className="text-xs text-muted-foreground truncate">
                      Next: {nextEvent.title}
                      {nextEvent.scheduled_for && (
                        <span className="ml-1">
                          · {new Date(nextEvent.scheduled_for).toLocaleDateString("en-IE", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <Button variant="ghost" size="sm" className="gap-1 text-xs flex-shrink-0">
                  View Journey <ArrowRight className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function JourneyVelocityBadge({ candidateId, phase }: { candidateId: string | null; phase: string }) {
  const isEngagementPhase = ["onboarding", "probation"].includes(phase);
  const { velocity } = useVelocityForCandidate(isEngagementPhase && candidateId ? candidateId : undefined);
  if (!velocity) return null;
  return <VelocityBadge velocity={velocity} />;
}
