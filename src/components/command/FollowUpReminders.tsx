import { ClipboardList } from "lucide-react";
import { isToday, isThisWeek, format } from "date-fns";
import type { Intervention } from "@/hooks/useCommandCentre";

interface Props {
  interventions: Intervention[];
}

export function FollowUpReminders({ interventions }: Props) {
  const withFollowUp = interventions.filter((i) => i.follow_up_date);
  const todayItems = withFollowUp.filter((i) => isToday(new Date(i.follow_up_date!)));
  const weekItems = withFollowUp.filter(
    (i) => !isToday(new Date(i.follow_up_date!)) && isThisWeek(new Date(i.follow_up_date!), { weekStartsOn: 1 })
  );

  if (todayItems.length === 0 && weekItems.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground mb-3 flex items-center gap-2">
        <ClipboardList className="w-4 h-4" /> Upcoming Follow-Ups
      </h2>
      <div className="bg-card rounded-xl border p-4 space-y-3">
        {todayItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Today</p>
            {todayItems.map((i) => (
              <p key={i.id} className="text-sm text-foreground">
                • {i.summary.slice(0, 80)}{i.summary.length > 80 ? "..." : ""}
              </p>
            ))}
          </div>
        )}
        {weekItems.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">This Week</p>
            {weekItems.map((i) => (
              <p key={i.id} className="text-sm text-foreground">
                • <span className="text-muted-foreground text-xs">{format(new Date(i.follow_up_date!), "EEE")}</span>{" "}
                {i.summary.slice(0, 80)}{i.summary.length > 80 ? "..." : ""}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
