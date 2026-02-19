import { VELOCITY_LEVELS, TREND_ARROWS, type VelocityScore } from "@/utils/velocityScoring";

interface VelocityBadgeProps {
  velocity: VelocityScore | null;
  compact?: boolean;
}

export function VelocityBadge({ velocity, compact }: VelocityBadgeProps) {
  if (!velocity) return null;

  const info = VELOCITY_LEVELS[velocity.level];
  const arrow = TREND_ARROWS[velocity.trend];

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${info.color}`}>
        {info.dot} {velocity.score}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${info.bg} ${info.border} border ${info.color}`}>
      {info.dot} {velocity.score} {info.label} {arrow}
    </span>
  );
}
