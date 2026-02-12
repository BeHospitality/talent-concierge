import { Candidate, CandidateStage } from "@/data/mockData";
import { motion } from "framer-motion";
import { Users, AlertTriangle, FileSignature, Plane } from "lucide-react";

interface Props {
  candidates: Candidate[];
  onStatClick?: (stage: CandidateStage | "all" | "at_risk") => void;
}

export default function StatsCards({ candidates, onStatClick }: Props) {
  const stats = [
    {
      label: "Total Active",
      value: candidates.length,
      icon: Users,
      color: "text-primary" as const,
      stage: "all" as const,
    },
    {
      label: "At Risk",
      value: candidates.filter((c) => c.risk_level === "high").length,
      icon: AlertTriangle,
      color: "text-destructive" as const,
      highlight: true,
      stage: "at_risk" as const,
    },
    {
      label: "Offers Pending",
      value: candidates.filter((c) => c.current_stage === "offer_pending").length,
      icon: FileSignature,
      color: "text-warning" as const,
      stage: "offer_pending" as const,
    },
    {
      label: "Pre-Arrival",
      value: candidates.filter((c) => c.current_stage === "pre_arrival").length,
      icon: Plane,
      color: "text-success" as const,
      stage: "pre_arrival" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={() => onStatClick?.(stat.stage)}
          className={`bg-card rounded-xl border border-border/50 p-5 card-hover cursor-pointer ${
            stat.highlight ? "border-destructive/30" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <stat.icon className={`w-5 h-5 ${stat.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
          <p className={`text-3xl font-bold ${stat.highlight ? "text-destructive" : ""}`}>
            {stat.value}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
