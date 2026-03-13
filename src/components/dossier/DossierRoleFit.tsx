import { motion } from "framer-motion";
import { Briefcase, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRoleFitNarrative } from "@/utils/dossierNarratives";

interface DeptMatch {
  department: string;
  fitScore: number;
}

interface Props {
  candidateName: string;
  departments: DeptMatch[];
  archetype?: string;
  dimensions: Record<string, number>;
}

export function DossierRoleFit({ candidateName, departments, archetype, dimensions }: Props) {
  if (!departments || departments.length === 0) return null;

  const top2 = departments.slice(0, 2);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
      className="bg-card rounded-xl border border-border p-6 md:p-8">
      <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-primary" /> Recommended Roles
      </h2>
      <p className="text-sm text-muted-foreground mb-5">
        Based on DNA profile, {candidateName} is particularly well-suited for:
      </p>

      <div className="grid gap-4">
        {top2.map((dept, i) => (
          <div
            key={i}
            className={`p-5 rounded-xl border ${
              i === 0
                ? "bg-primary/5 border-primary/30"
                : "bg-muted/30 border-border/40"
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={i === 0 ? "default" : "secondary"}
                className="text-[10px] font-semibold"
              >
                {i === 0 ? "Best Fit" : "Also Strong"}
              </Badge>
            </div>
            <h3 className="font-semibold text-base">{dept.department}</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {getRoleFitNarrative(dept.department, archetype, dimensions)}
            </p>
            {i === 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {dimensions.autonomy > 65 && (
                  <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--success))]">
                    <CheckCircle2 className="w-3 h-3" /> Independent decision-making
                  </span>
                )}
                {dimensions.collaboration > 65 && (
                  <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--success))]">
                    <CheckCircle2 className="w-3 h-3" /> Strong team fit
                  </span>
                )}
                {dimensions.adaptability > 65 && (
                  <span className="inline-flex items-center gap-1 text-xs text-[hsl(var(--success))]">
                    <CheckCircle2 className="w-3 h-3" /> Adaptable to change
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
