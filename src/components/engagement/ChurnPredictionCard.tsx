import { TrendingUp, AlertTriangle, Shield, Lightbulb, RefreshCw, Info } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CHURN_RISK_COLORS, type ChurnPrediction } from "@/utils/churnPrediction";
import { formatDistanceToNow } from "date-fns";

interface ChurnPredictionCardProps {
  prediction: ChurnPrediction | null;
  isLoading: boolean;
  updatedAt?: string | null;
  onRefresh?: () => void;
}

export function ChurnPredictionCard({ prediction, isLoading, updatedAt, onRefresh }: ChurnPredictionCardProps) {
  if (isLoading) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-5 animate-pulse">
        <div className="h-4 w-48 bg-muted rounded mb-4" />
        <div className="h-20 bg-muted rounded" />
      </div>
    );
  }

  if (!prediction) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">6-Week Churn Prediction</h3>
        </div>
        <div className="flex flex-col items-center py-6 text-center">
          <Info className="w-8 h-8 text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">Insufficient data for prediction</p>
          <p className="text-xs text-muted-foreground/70 mt-1">Check-in data is needed to generate a churn prediction</p>
        </div>
      </div>
    );
  }

  const colors = CHURN_RISK_COLORS[prediction.riskLevel];
  const isCritical = prediction.probability >= 50;

  return (
    <div className={`bg-card rounded-xl border p-5 ${isCritical ? "border-destructive/30" : "border-border/50"}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-4 h-4 ${colors.text}`} />
          <h3 className="text-sm font-semibold">6-Week Churn Prediction</h3>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px]">
            {prediction.confidence.toUpperCase()} confidence
          </Badge>
          {onRefresh && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onRefresh}>
              <RefreshCw className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Probability display */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative w-20 h-20 flex-shrink-0">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={
                prediction.probability < 25
                  ? "hsl(var(--success))"
                  : prediction.probability < 50
                  ? "hsl(var(--warning))"
                  : prediction.probability < 75
                  ? "hsl(25, 95%, 53%)"
                  : "hsl(var(--destructive))"
              }
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${prediction.probability}, 100`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-lg font-bold ${colors.text}`}>{prediction.probability}%</span>
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">probability of departure within 6 weeks</p>
          <p className={`text-sm font-semibold mt-1 ${colors.text}`}>
            {colors.dot} Risk: {prediction.riskLevel.toUpperCase()}
          </p>
          {prediction.predictedWeek && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Est. departure: Week {prediction.predictedWeek}-{prediction.predictedWeek + 1}
            </p>
          )}
        </div>
      </div>

      {/* Risk factors */}
      {prediction.factors.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning" />
            <span className="text-xs font-semibold text-warning">Risk Factors</span>
          </div>
          <div className="space-y-1.5">
            {prediction.factors.map((factor, i) => (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs">{factor.name}</span>
                        <span className="text-[10px] text-muted-foreground">{factor.weight}%</span>
                      </div>
                      <Progress
                        value={factor.weight}
                        className="h-1.5"
                      />
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="left" className="max-w-xs">
                  <p className="text-xs">{factor.description}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* Protective factors */}
      {prediction.protectiveFactors.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Shield className="w-3.5 h-3.5 text-success" />
            <span className="text-xs font-semibold text-success">Protective Factors</span>
          </div>
          <ul className="space-y-0.5">
            {prediction.protectiveFactors.map((f, i) => (
              <li key={i} className="text-xs text-muted-foreground">✅ {f}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended actions */}
      {prediction.recommendedActions.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">Recommended Actions</span>
          </div>
          <ol className="space-y-0.5">
            {prediction.recommendedActions.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground">{i + 1}. {r}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Confidence warning */}
      {prediction.confidence === "low" && (
        <p className="text-[10px] text-muted-foreground/70 mt-3 italic">
          ⚠️ Low confidence — more check-in data needed for accurate prediction
        </p>
      )}

      {updatedAt && (
        <p className="text-[10px] text-muted-foreground/50 mt-2">
          Last updated: {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}
