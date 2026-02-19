import { motion } from "framer-motion";
import { AlertTriangle, Clock, CheckCircle2, PartyPopper } from "lucide-react";

interface Props {
  overdue: number;
  dueToday: number;
  completedThisWeek: number;
  graduated: number;
  activeFilter: string | null;
  onFilter: (filter: string | null) => void;
}

const stats = [
  { key: "overdue", label: "Overdue", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  { key: "dueToday", label: "Due Today", icon: Clock, color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  { key: "completedThisWeek", label: "Done This Week", icon: CheckCircle2, color: "text-success", bg: "bg-success/10 border-success/30" },
  { key: "graduated", label: "Graduated", icon: PartyPopper, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
] as const;

export function JourneyDashboardStats({ overdue, dueToday, completedThisWeek, graduated, activeFilter, onFilter }: Props) {
  const values: Record<string, number> = { overdue, dueToday, completedThisWeek, graduated };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((s, i) => (
        <motion.button
          key={s.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          onClick={() => onFilter(activeFilter === s.key ? null : s.key)}
          className={`rounded-xl border p-5 text-left transition-all card-hover ${s.bg} ${
            activeFilter === s.key ? "ring-2 ring-primary" : ""
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {s.label}
            </span>
          </div>
          <p className={`text-3xl font-bold ${s.color}`}>{values[s.key]}</p>
        </motion.button>
      ))}
    </div>
  );
}
