import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle } from "lucide-react";

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

interface JourneyProgressCardProps {
  candidateId: string;
}

export function JourneyProgressCard({ candidateId }: JourneyProgressCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["journey_progress", candidateId],
    queryFn: async () => {
      const { data: journey } = await supabase
        .from("journey_blueprints")
        .select("*")
        .eq("candidate_id", candidateId)
        .maybeSingle();

      if (!journey) return null;

      const { data: events } = await supabase
        .from("journey_events")
        .select("*")
        .eq("journey_id", journey.id)
        .eq("phase", journey.current_phase)
        .order("day_offset", { ascending: true });

      const allEvents = events || [];
      const completed = allEvents.filter((e) => e.status === "completed").length;
      const total = allEvents.length;
      const now = new Date();
      const overdue = allEvents.filter(
        (e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < now
      ).length;
      const next = allEvents.find(
        (e) => (e.status === "pending" || e.status === "active") && e.scheduled_for && new Date(e.scheduled_for) >= now
      );

      return {
        phase: journey.current_phase,
        status: journey.status,
        completed,
        total,
        overdue,
        nextEvent: next,
      };
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (!data) return null;

  const { phase, completed, total, overdue, nextEvent } = data;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-4 mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm">{PHASE_ICONS[phase] || "🛤️"}</span>
        <span className="text-sm font-semibold">{PHASE_LABELS[phase] || phase}</span>
      </div>
      <div className="flex items-center gap-3 mb-2">
        <Progress value={pct} className="h-1.5 flex-1" />
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
      {overdue > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5 text-destructive">
          <AlertTriangle className="w-3 h-3" />
          <span className="text-xs font-medium">{overdue} overdue</span>
        </div>
      )}
    </div>
  );
}
