import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { JourneyPhaseSection } from "./JourneyPhaseSection";
import { PhaseTransitionButton } from "./PhaseTransitionButton";
import { Progress } from "@/components/ui/progress";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const PHASE_ORDER = ["screening", "interview", "offer", "pre_arrival", "onboarding", "probation"];

interface JourneyTimelineProps {
  candidateId: string;
  organizationId: string;
}

export function JourneyTimeline({ candidateId, organizationId }: JourneyTimelineProps) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["journey_timeline", candidateId],
    queryFn: async () => {
      const { data: journey, error } = await supabase
        .from("journey_blueprints")
        .select("*")
        .eq("candidate_id", candidateId)
        .maybeSingle();

      if (error) throw error;
      if (!journey) return null;

      const { data: events } = await supabase
        .from("journey_events")
        .select("*")
        .eq("journey_id", journey.id)
        .order("day_offset", { ascending: true });

      return { journey, events: events || [] };
    },
    refetchInterval: 30000,
  });

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["journey_timeline", candidateId] });
  };

  if (isLoading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  // No journey exists
  if (!data) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
        <p className="text-muted-foreground text-sm mb-3">
          No journey blueprint yet. Journey starts automatically when the candidate completes their DNA assessment.
        </p>
        <Link to={`/candidate/${candidateId}`}>
          <Button variant="outline" size="sm" className="gap-2">
            <Send className="w-3.5 h-3.5" />Send DNA Assessment Link
          </Button>
        </Link>
      </div>
    );
  }

  const { journey, events } = data;

  // Group events by phase
  const eventsByPhase = PHASE_ORDER.reduce((acc, phase) => {
    acc[phase] = events.filter((e) => e.phase === phase);
    return acc;
  }, {} as Record<string, typeof events>);

  const currentPhaseIdx = PHASE_ORDER.indexOf(journey.current_phase);
  const totalEvents = events.length;
  const completedEvents = events.filter((e) => e.status === "completed").length;
  const progressPct = totalEvents > 0 ? Math.round((completedEvents / totalEvents) * 100) : 0;

  // Check if current phase milestones are all done
  const currentPhaseEvents = eventsByPhase[journey.current_phase] || [];
  const currentMilestones = currentPhaseEvents.filter((e) => e.event_type === "milestone");
  const allMilestonesDone = currentMilestones.length > 0 && currentMilestones.every((m) => m.status === "completed");

  // Journey status banners
  const isCompleted = journey.status === "completed";
  const isPaused = journey.status === "paused";
  const isCancelled = journey.status === "cancelled";

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Journey Blueprint</h2>
          <p className="text-xs text-muted-foreground">
            Phase {currentPhaseIdx + 1}/{PHASE_ORDER.length}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{progressPct}% complete</span>
      </div>

      {/* Progress bar */}
      <Progress value={progressPct} className="h-2 mb-6" />

      {/* Status banners */}
      {isCompleted && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 mb-4 text-center">
          <p className="text-sm font-semibold text-success">🎉 Journey complete! Congratulations on reaching Day 90.</p>
        </div>
      )}
      {isPaused && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 mb-4">
          <p className="text-sm font-medium text-warning">⏸️ Journey paused</p>
        </div>
      )}
      {isCancelled && (
        <div className="bg-muted/50 border border-border/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-muted-foreground">Journey cancelled</p>
        </div>
      )}

      {/* Phase sections */}
      <div className="space-y-1">
        {PHASE_ORDER.map((phase, idx) => {
          const phaseEvents = eventsByPhase[phase];
          if (!phaseEvents || phaseEvents.length === 0) {
            // Show collapsed placeholder for future phases
            if (idx > currentPhaseIdx) {
              return (
                <div key={phase} className="border-l-2 border-l-border/20 pl-4 py-2 opacity-50">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {phase.replace("_", "-")} · Upcoming
                  </p>
                </div>
              );
            }
            return null;
          }

          const isCurrent = phase === journey.current_phase;
          const phaseCompleted = idx < currentPhaseIdx;
          const isFuture = idx > currentPhaseIdx;

          return (
            <JourneyPhaseSection
              key={phase}
              phase={phase}
              events={phaseEvents}
              isCurrent={isCurrent}
              isCompleted={phaseCompleted}
              isFuture={isFuture}
              onEventCompleted={handleRefresh}
            />
          );
        })}
      </div>

      {/* Phase transition */}
      {allMilestonesDone && !isCompleted && !isPaused && !isCancelled && (
        <div className="mt-4">
          <PhaseTransitionButton
            journeyId={journey.id}
            currentPhase={journey.current_phase}
            onTransitioned={handleRefresh}
          />
        </div>
      )}
    </div>
  );
}
