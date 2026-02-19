import { Zap, AlertTriangle, Lightbulb } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { VELOCITY_LEVELS, TREND_ARROWS, MOOD_EMOJIS, MOOD_LABELS, type VelocityScore, type EngagementCheckin } from "@/utils/velocityScoring";

interface VelocityCardProps {
  velocity: VelocityScore;
  checkins: EngagementCheckin[];
}

export function VelocityCard({ velocity, checkins }: VelocityCardProps) {
  const info = VELOCITY_LEVELS[velocity.level];
  const arrow = TREND_ARROWS[velocity.trend];
  const latest = checkins.length > 0 ? checkins[checkins.length - 1] : null;
  const isAtRisk = velocity.score < 50;

  return (
    <div className={`bg-card rounded-xl border p-5 ${isAtRisk ? "border-destructive/30" : "border-border/50"}`}>
      <div className="flex items-center gap-2 mb-4">
        <Zap className={`w-4 h-4 ${info.color}`} />
        <h3 className="text-sm font-semibold">Engagement Velocity</h3>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <span className={`text-2xl font-bold ${info.color}`}>{velocity.score}</span>
        <span className="text-sm text-muted-foreground">/100</span>
        <span className={`text-sm font-semibold ${info.color}`}>{info.dot} {info.label} {arrow}</span>
      </div>

      <Progress value={velocity.score} className="h-2 mb-3" />

      <div className="space-y-1 text-xs text-muted-foreground mb-4">
        <p>Trend: <span className="font-medium capitalize">{velocity.trend}</span></p>
        {latest && (
          <p>
            Last check-in: Day {latest.day_number} — {MOOD_EMOJIS[latest.mood - 1]} {MOOD_LABELS[latest.mood - 1]}
          </p>
        )}
      </div>

      {velocity.riskFactors.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning">Risk Factors</span>
          </div>
          <ul className="space-y-0.5">
            {velocity.riskFactors.map((f, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {f}</li>
            ))}
          </ul>
        </div>
      )}

      {velocity.recommendations.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Recommendations</span>
          </div>
          <ul className="space-y-0.5">
            {velocity.recommendations.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground">• {r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
