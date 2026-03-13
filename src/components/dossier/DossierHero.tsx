import { motion } from "framer-motion";
import { User } from "lucide-react";

const ARCHETYPE_CONFIG: Record<string, { emoji: string; label: string; tagline: string }> = {
  lion: { emoji: "🦁", label: "Lion", tagline: "Natural leader · High autonomy · Results-driven" },
  whale: { emoji: "🐋", label: "Whale", tagline: "Team player · Collaborative · Relationship-focused" },
  falcon: { emoji: "🦅", label: "Falcon", tagline: "Detail-oriented · Precise · Quality-driven" },
};

interface Props {
  candidateName: string;
  role?: string | null;
  department?: string | null;
  archetype?: string | null;
}

export function DossierHero({ candidateName, role, department, archetype }: Props) {
  const archetypeInfo = archetype ? ARCHETYPE_CONFIG[archetype] : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-6 md:p-8">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
          {archetypeInfo ? (
            <span className="text-3xl">{archetypeInfo.emoji}</span>
          ) : (
            <User className="w-8 h-8 text-primary" />
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{candidateName}</h1>
          {role && (
            <p className="text-muted-foreground mt-0.5">
              {role}{department ? ` · ${department}` : ""}
            </p>
          )}
          {archetypeInfo && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-lg">{archetypeInfo.emoji}</span>
              <span className="text-sm font-semibold text-primary">{archetypeInfo.label}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">— {archetypeInfo.tagline}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
