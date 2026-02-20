import { Candidate, STAGE_LABELS } from "@/data/mockData";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Clock } from "lucide-react";
import { JourneyPipelineIndicator } from "@/components/journey/JourneyPipelineIndicator";
import { VelocityBadge } from "@/components/engagement/VelocityBadge";
import { ChurnBadge } from "@/components/engagement/ChurnBadge";
import { useVelocityForCandidate } from "@/hooks/useEngagementCheckins";
import { useChurnForCandidate } from "@/hooks/useChurnPrediction";
import { useDemoMode } from "@/contexts/DemoModeContext";

interface Props {
  candidate: Candidate;
  index: number;
}

export default function CandidateCard({ candidate, index }: Props) {
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const isOnboarding = ["offer_accepted", "pre_arrival", "active"].includes(candidate.current_stage);
  const { velocity } = useVelocityForCandidate(!isDemoMode && isOnboarding ? candidate.id : undefined);
  const { prediction: churnPrediction } = useChurnForCandidate(!isDemoMode && isOnboarding ? candidate.id : undefined);
  const isAtRisk = candidate.risk_level === "high";
  const isMedium = candidate.risk_level === "medium";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      onClick={() => navigate(`/candidate/${candidate.id}`)}
      className={`bg-card rounded-xl border p-5 cursor-pointer card-hover ${
        isAtRisk
          ? "border-destructive/50 crimson-pulse"
          : isMedium
          ? "border-warning/30"
          : "border-border/50"
      }`}
    >
      {/* Top: Photo + Name */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-11 h-11 rounded-full bg-muted overflow-hidden flex-shrink-0 border-2 border-border/50">
          <img src={candidate.photo_url} alt={candidate.full_name} className="w-full h-full object-cover" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate">{candidate.full_name}</h3>
          {candidate.role_title && (
            <p className="text-xs text-muted-foreground truncate">{candidate.role_title}</p>
          )}
          <div className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span className="text-xs truncate">{candidate.desired_location}</span>
          </div>
        </div>
      </div>

      {/* Stage badge */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
          {STAGE_LABELS[candidate.current_stage]}
        </span>
        {candidate.archetype && (
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              candidate.archetype === "lion"
                ? "bg-primary/20 text-primary"
                : candidate.archetype === "whale"
                ? "bg-blue-500/20 text-blue-400"
                : "bg-success/20 text-success"
            }`}
          >
            {candidate.archetype}
          </span>
        )}
      </div>

      {/* Bottom stats */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>{candidate.days_in_stage}d in stage</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className={`w-2 h-2 rounded-full ${
              isAtRisk ? "bg-destructive" : isMedium ? "bg-warning" : "bg-success"
            }`}
          />
          <span
            className={`font-semibold ${
              isAtRisk ? "text-destructive" : isMedium ? "text-warning" : "text-success"
            }`}
          >
            {candidate.engagement_score}%
          </span>
        </div>

        {/* Journey indicator */}
        {!isDemoMode && candidate.organization_id && (
          <JourneyPipelineIndicator candidateId={candidate.id} organizationId={candidate.organization_id} />
        )}
      </div>

      {/* Velocity & churn badges for onboarding/probation candidates */}
      {(velocity || churnPrediction) && (
        <div className="mt-2 pt-2 border-t border-border/30 flex items-center gap-2 flex-wrap">
          {velocity && <VelocityBadge velocity={velocity} />}
          {churnPrediction && candidate.days_in_stage >= 7 && <ChurnBadge prediction={churnPrediction} />}
        </div>
      )}
    </motion.div>
  );
}
