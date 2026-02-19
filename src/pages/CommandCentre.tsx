import { motion } from "framer-motion";
import { RefreshCw, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useCommandCentre } from "@/hooks/useCommandCentre";
import { PortfolioStats } from "@/components/command/PortfolioStats";
import { UrgentInterventions } from "@/components/command/UrgentInterventions";
import { MonitoringList } from "@/components/command/MonitoringList";
import { WinsThisWeek } from "@/components/command/WinsThisWeek";
import { PortfolioTable } from "@/components/command/PortfolioTable";
import { FollowUpReminders } from "@/components/command/FollowUpReminders";

export default function CommandCentre() {
  const {
    stats, urgentCandidates, monitoringCandidates,
    wins, patterns, propertyStats,
    interventions, upcomingFollowUps,
    totalActive, totalProperties,
    isLoading, refetch,
  } = useCommandCentre();

  return (
    <div className="max-w-6xl mx-auto space-y-2">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Crosshair className="w-6 h-6 text-primary" />
            Command Centre
          </h1>
          <p className="text-sm text-muted-foreground">
            {totalProperties} Properties · {totalActive} Active Journeys · {format(new Date(), "EEEE, MMM d")}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refetch} disabled={isLoading} className="gap-1">
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </motion.div>

      <PortfolioStats {...stats} />
      <UrgentInterventions candidates={urgentCandidates} onLogged={refetch} />
      <MonitoringList candidates={monitoringCandidates} patterns={patterns} />
      <WinsThisWeek wins={wins} />
      <PortfolioTable properties={propertyStats} />
      <FollowUpReminders interventions={upcomingFollowUps} />
    </div>
  );
}
