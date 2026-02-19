import { PartyPopper } from "lucide-react";
import type { JourneyWithDetails } from "@/hooks/useJourneyDashboard";

interface Props {
  journeys: JourneyWithDetails[];
}

export function RecentlyCompletedList({ journeys }: Props) {
  if (journeys.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
        <PartyPopper className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">No journeys completed yet. Your first Day 90 celebration is coming!</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
        <PartyPopper className="w-4 h-4 text-primary" /> Recently Completed
      </h2>
      <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/50 overflow-hidden">
        {journeys.map((j) => (
          <div key={j.id} className="flex items-center gap-3 p-4">
            <span className="text-lg">🎉</span>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-sm">{j.candidates?.full_name || "Unknown"}</span>
              <span className="text-xs text-muted-foreground ml-2">
                Day 90 reached!
                {j.updated_at && (
                  <span className="ml-1">
                    · {new Date(j.updated_at).toLocaleDateString("en-IE", { month: "short", day: "numeric" })}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
