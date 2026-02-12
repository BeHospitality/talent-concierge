import { Candidate, CandidateStage } from "@/data/mockData";
import CandidateCard from "./CandidateCard";

interface Props {
  candidates: Candidate[];
  activeStage: CandidateStage | "all" | "at_risk";
}

export default function CandidateGrid({ candidates, activeStage }: Props) {
  const filtered =
    activeStage === "all"
      ? candidates
      : activeStage === "at_risk"
      ? candidates.filter((c) => c.risk_level === "high")
      : candidates.filter((c) => c.current_stage === activeStage);

  if (filtered.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <p className="text-sm">No candidates in this stage</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.map((candidate, i) => (
        <CandidateCard key={candidate.id} candidate={candidate} index={i} />
      ))}
    </div>
  );
}
