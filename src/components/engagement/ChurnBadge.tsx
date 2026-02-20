import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHURN_RISK_COLORS, type ChurnPrediction } from "@/utils/churnPrediction";

interface ChurnBadgeProps {
  prediction: ChurnPrediction | null;
  compact?: boolean;
}

export function ChurnBadge({ prediction, compact }: ChurnBadgeProps) {
  if (!prediction) return null;

  const colors = CHURN_RISK_COLORS[prediction.riskLevel];
  const topFactor = prediction.factors[0]?.name || "No specific factors";

  if (compact) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${colors.text}`}>
            📈 {prediction.probability}%
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">6-Week Churn: {prediction.probability}% ({prediction.riskLevel})</p>
          <p className="text-xs text-muted-foreground">Top factor: {topFactor}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${colors.bg} ${colors.border} border ${colors.text}`}
        >
          📈 {prediction.probability}% churn · {prediction.riskLevel.toUpperCase()} {colors.dot}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs font-medium">6-Week Churn Prediction</p>
        <p className="text-xs text-muted-foreground">Top factor: {topFactor}</p>
        {prediction.confidence === "low" && (
          <p className="text-xs text-warning">⚠️ Low confidence — needs more data</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
