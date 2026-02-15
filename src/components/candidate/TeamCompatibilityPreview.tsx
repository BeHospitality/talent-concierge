import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import type { Archetype } from "@/data/mockData";

interface TeamCompatibilityPreviewProps {
  candidateArchetype?: Archetype;
  candidateName: string;
}

const ARCHETYPE_EMOJIS: Record<string, string> = { lion: "🦁", whale: "🐋", falcon: "🦅" };

// Simulated team composition for demo
const TEAM_COMPOSITION = {
  lion: { count: 2, pct: 25 },
  whale: { count: 4, pct: 50 },
  falcon: { count: 2, pct: 25 },
};

export function TeamCompatibilityPreview({ candidateArchetype, candidateName }: TeamCompatibilityPreviewProps) {
  if (!candidateArchetype) return null;

  const compatibilityScore = candidateArchetype === "whale" ? 89 : candidateArchetype === "lion" ? 72 : 78;
  const buddyName = candidateArchetype === "lion" ? "Sarah O'Brien (Whale)" : candidateArchetype === "whale" ? "James Murphy (Falcon)" : "Raj Patel (Whale)";

  const scoreColor = compatibilityScore >= 80 ? "text-success" : compatibilityScore >= 60 ? "text-primary" : "text-destructive";

  const archetypeDescriptions: Record<Archetype, string> = {
    lion: `${candidateName} (Lion) brings strong leadership to the team. Our analysis shows ${compatibilityScore}% compatibility. We recommend pairing with ${buddyName} as a buddy for optimal onboarding.`,
    whale: `${candidateName} (Whale) is a strong cultural fit for the team. Our analysis shows ${compatibilityScore}% compatibility with the current team composition. We recommend pairing with ${buddyName} as a buddy.`,
    falcon: `${candidateName} (Falcon) brings precision and attention to detail. Our analysis shows ${compatibilityScore}% compatibility. We recommend pairing with ${buddyName} for mentorship.`,
  };

  return (
    <div className="rounded-xl border border-border/50 p-4 bg-muted/20 mt-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Team Fit Analysis</p>

      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{ARCHETYPE_EMOJIS[candidateArchetype]}</span>
          <div>
            <p className="text-sm font-semibold capitalize">{candidateArchetype} Archetype</p>
            <p className="text-xs text-muted-foreground">{candidateName}</p>
          </div>
        </div>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}
          className="ml-auto text-center">
          <span className={`text-2xl font-bold ${scoreColor}`}>{compatibilityScore}%</span>
          <p className="text-[10px] text-muted-foreground">Team Fit</p>
        </motion.div>
      </div>

      {/* Team Composition Bar */}
      <div className="mb-3">
        <p className="text-[10px] text-muted-foreground mb-1">Current Team Composition</p>
        <div className="h-4 rounded-full overflow-hidden flex">
          <motion.div initial={{ width: 0 }} animate={{ width: `${TEAM_COMPOSITION.lion.pct}%` }}
            transition={{ duration: 0.6 }}
            className="bg-primary h-full" title={`Lions: ${TEAM_COMPOSITION.lion.pct}%`} />
          <motion.div initial={{ width: 0 }} animate={{ width: `${TEAM_COMPOSITION.whale.pct}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="bg-blue-500 h-full" title={`Whales: ${TEAM_COMPOSITION.whale.pct}%`} />
          <motion.div initial={{ width: 0 }} animate={{ width: `${TEAM_COMPOSITION.falcon.pct}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-purple-500 h-full" title={`Falcons: ${TEAM_COMPOSITION.falcon.pct}%`} />
        </div>
        <div className="flex gap-4 mt-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />🦁 {TEAM_COMPOSITION.lion.pct}%
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />🐋 {TEAM_COMPOSITION.whale.pct}%
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-purple-500 inline-block" />🦅 {TEAM_COMPOSITION.falcon.pct}%
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground italic">
        "{archetypeDescriptions[candidateArchetype]}"
      </p>

      {compatibilityScore < 80 && (
        <div className="mt-2">
          <Badge variant="secondary" className="text-[10px]">⚠️ Risk flags present — see Placement Risk section</Badge>
        </div>
      )}
    </div>
  );
}
