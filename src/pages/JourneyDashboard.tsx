import { useState } from "react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { useJourneyDashboard } from "@/hooks/useJourneyDashboard";
import { JourneyDashboardStats } from "@/components/journey/JourneyDashboardStats";
import { NeedsAttentionList } from "@/components/journey/NeedsAttentionList";
import { ActiveJourneysList } from "@/components/journey/ActiveJourneysList";
import { RecentlyCompletedList } from "@/components/journey/RecentlyCompletedList";

export default function JourneyDashboard() {
  const { activeJourneys, completedJourneys, stats, overdueEvents, dueTodayEvents, isLoading, refetch } = useJourneyDashboard();
  const [statFilter, setStatFilter] = useState<string | null>(null);

  const attentionEvents = [...overdueEvents, ...dueTodayEvents];

  if (isLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-40 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          🛤️ Journey Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {activeJourneys.length} active journey{activeJourneys.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      <JourneyDashboardStats
        {...stats}
        activeFilter={statFilter}
        onFilter={setStatFilter}
      />

      {(!statFilter || statFilter === "overdue" || statFilter === "dueToday") && (
        <NeedsAttentionList events={attentionEvents} onCompleted={() => refetch()} />
      )}

      {(!statFilter || statFilter === "completedThisWeek") && (
        <ActiveJourneysList journeys={activeJourneys} />
      )}

      {(!statFilter || statFilter === "graduated") && (
        <RecentlyCompletedList journeys={completedJourneys} />
      )}
    </div>
  );
}
