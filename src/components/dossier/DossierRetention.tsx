import { motion } from "framer-motion";
import { Heart, CheckCircle2, AlertTriangle } from "lucide-react";
import { getRetentionInsights } from "@/utils/dossierNarratives";

interface Props {
  archetype?: string;
  dimensions: Record<string, number>;
}

export function DossierRetention({ archetype, dimensions }: Props) {
  const factors = getRetentionInsights(archetype, dimensions);

  if (factors.length === 0) return null;

  const positives = factors.filter((f) => f.type === "positive");
  const warnings = factors.filter((f) => f.type === "warning");

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
      className="bg-card rounded-xl border border-border p-6 md:p-8">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Heart className="w-5 h-5 text-primary" /> Keys to Long-Term Success
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        To maximise retention, this candidate will thrive when:
      </p>

      <div className="space-y-2.5">
        {positives.map((f, i) => (
          <div key={i} className="flex items-start gap-3 text-sm">
            <CheckCircle2 className="w-4 h-4 text-[hsl(var(--success))] flex-shrink-0 mt-0.5" />
            <span className="text-foreground">{f.text}</span>
          </div>
        ))}
        {warnings.map((f, i) => (
          <div key={i} className="flex items-start gap-3 text-sm mt-1">
            <AlertTriangle className="w-4 h-4 text-[hsl(var(--warning))] flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{f.text}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
