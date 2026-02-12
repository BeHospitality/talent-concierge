import { STAGE_ORDER, STAGE_LABELS, type Candidate, type CandidateStage } from "@/data/mockData";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";

interface Props {
  candidates: Candidate[];
  activeStage: CandidateStage | "all" | "at_risk";
  onStageClick: (stage: CandidateStage | "all" | "at_risk") => void;
}

export default function PipelineTracker({ candidates, activeStage, onStageClick }: Props) {
  const stageCounts = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = candidates.filter((c) => c.current_stage === stage).length;
    return acc;
  }, {} as Record<string, number>);

  const atRiskCount = candidates.filter((c) => c.risk_level === "high").length;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* All */}
        <button
          onClick={() => onStageClick("all")}
          className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all ${
            activeStage === "all"
              ? "bg-primary text-primary-foreground gold-glow"
              : "bg-card hover:bg-accent text-card-foreground"
          }`}
        >
          All ({candidates.length})
        </button>

        {/* Stage pills */}
        {STAGE_ORDER.map((stage, i) => (
          <motion.button
            key={stage}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onStageClick(stage)}
            className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeStage === stage
                ? "bg-primary text-primary-foreground gold-glow"
                : "bg-card hover:bg-accent text-card-foreground"
            }`}
          >
            {STAGE_LABELS[stage]} ({stageCounts[stage] || 0})
          </motion.button>
        ))}

        {/* At Risk */}
        <button
          onClick={() => onStageClick("at_risk")}
          className={`flex-shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeStage === "at_risk"
              ? "bg-destructive text-destructive-foreground crimson-pulse"
              : "bg-destructive/20 text-destructive hover:bg-destructive/30"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          At Risk ({atRiskCount})
        </button>
      </div>
    </div>
  );
}
