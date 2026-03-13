import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import type { StrengthCard } from "@/utils/dossierNarratives";

interface Props {
  strengths: StrengthCard[];
}

export function DossierStrengths({ strengths }: Props) {
  if (strengths.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
      className="bg-card rounded-xl border border-border p-6 md:p-8">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" /> Key Strengths
      </h2>
      <p className="text-sm text-muted-foreground mb-5">Top traits based on DNA profile assessment</p>

      <div className="grid gap-4">
        {strengths.map((s, i) => (
          <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 border border-border/40">
            <span className="text-2xl flex-shrink-0 mt-0.5">{s.icon}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">{s.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{s.description}</p>
              <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    s.level === "very-high"
                      ? "bg-[hsl(var(--success))] w-[95%]"
                      : s.level === "high"
                      ? "bg-primary w-[80%]"
                      : "bg-primary/60 w-[65%]"
                  }`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
