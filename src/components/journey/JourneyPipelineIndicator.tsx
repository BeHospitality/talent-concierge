import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface JourneyPipelineIndicatorProps {
  candidateId: string;
  organizationId: string;
}

const PHASE_SHORT: Record<string, string> = {
  screening: "Screen",
  interview: "Interview",
  offer: "Offer",
  pre_arrival: "Pre-Arr",
  onboarding: "Onboard",
  probation: "Probation",
};

export function JourneyPipelineIndicator({ candidateId, organizationId }: JourneyPipelineIndicatorProps) {
  const { data } = useQuery({
    queryKey: ["journey_pipeline", candidateId],
    queryFn: async () => {
      const { data: journey } = await supabase
        .from("journey_blueprints")
        .select("current_phase, status")
        .eq("candidate_id", candidateId)
        .maybeSingle();

      if (!journey) return null;

      const { data: events } = await supabase
        .from("journey_events")
        .select("status, scheduled_for")
        .eq("journey_id", candidateId)
        .limit(100);

      // Fetch events by journey (need journey id)
      const { data: journeyWithEvents } = await supabase
        .from("journey_blueprints")
        .select("id")
        .eq("candidate_id", candidateId)
        .single();

      if (!journeyWithEvents) return { phase: journey.current_phase, completed: 0, total: 0, overdue: 0 };

      const { data: allEvents } = await supabase
        .from("journey_events")
        .select("status, scheduled_for")
        .eq("journey_id", journeyWithEvents.id);

      const evts = allEvents || [];
      const completed = evts.filter((e) => e.status === "completed").length;
      const total = evts.length;
      const now = new Date();
      const overdue = evts.filter(
        (e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < now
      ).length;

      return { phase: journey.current_phase, completed, total, overdue };
    },
    staleTime: 60000,
  });

  if (!data) return null;

  const { phase, completed, total, overdue } = data;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mt-2 pt-2 border-t border-border/30">
      <div className="flex items-center justify-between text-[10px] mb-1">
        <span className="text-muted-foreground flex items-center gap-1">
          🛤️ {PHASE_SHORT[phase] || phase}
        </span>
        <span className="text-muted-foreground">
          {completed}/{total} ✅
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <Progress value={pct} className="h-1 flex-1" />
        {overdue > 0 && (
          <span className="w-2 h-2 rounded-full bg-destructive flex-shrink-0 animate-pulse" />
        )}
      </div>
    </div>
  );
}
