import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { getWorkingStyle } from "@/utils/dossierNarratives";

interface Props {
  archetype?: string;
  dimensions: Record<string, number>;
}

export function DossierWorkingStyle({ archetype, dimensions }: Props) {
  const style = getWorkingStyle(archetype, dimensions);

  const items = [
    { title: "Decision Making", icon: "🎯", text: style.decisionMaking },
    { title: "Team Dynamics", icon: "👥", text: style.teamDynamics },
    { title: "Under Pressure", icon: "⚡", text: style.stressResponse },
    { title: "Quality & Detail", icon: "✨", text: style.qualityFocus },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
      className="bg-card rounded-xl border border-border p-6 md:p-8">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Users className="w-5 h-5 text-primary" /> Working Style
      </h2>
      <p className="text-sm text-muted-foreground mb-5">How this candidate operates day-to-day</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 rounded-xl bg-muted/30 border border-border/40">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.icon}</span>
              <h3 className="font-semibold text-sm">{item.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
