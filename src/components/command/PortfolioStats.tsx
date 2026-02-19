import { motion } from "framer-motion";
import { AlertTriangle, Eye, Heart, PartyPopper } from "lucide-react";

interface Props {
  urgent: number;
  monitoring: number;
  healthy: number;
  graduated: number;
}

const stats = [
  { key: "urgent", label: "Urgent", icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10 border-destructive/30" },
  { key: "monitoring", label: "Monitoring", icon: Eye, color: "text-warning", bg: "bg-warning/10 border-warning/30" },
  { key: "healthy", label: "Healthy", icon: Heart, color: "text-success", bg: "bg-success/10 border-success/30" },
  { key: "graduated", label: "Graduates", icon: PartyPopper, color: "text-primary", bg: "bg-primary/10 border-primary/30" },
] as const;

export function PortfolioStats({ urgent, monitoring, healthy, graduated }: Props) {
  const values: Record<string, number> = { urgent, monitoring, healthy, graduated };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      {stats.map((s, i) => (
        <motion.div
          key={s.key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className={`rounded-xl border p-5 text-left ${s.bg}`}
        >
          <div className="flex items-center justify-between mb-3">
            <s.icon className={`w-5 h-5 ${s.color}`} />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {s.label}
            </span>
          </div>
          <p className={`text-3xl font-bold ${s.color}`}>{values[s.key]}</p>
        </motion.div>
      ))}
    </div>
  );
}
