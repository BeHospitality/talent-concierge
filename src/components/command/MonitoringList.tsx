import { Eye, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { VELOCITY_LEVELS, MOOD_EMOJIS } from "@/utils/velocityScoring";
import type { CandidateVelocity } from "@/hooks/useCommandCentre";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Pattern {
  orgId: string;
  orgName: string;
  count: number;
  description: string;
}

interface Props {
  candidates: CandidateVelocity[];
  patterns: Pattern[];
}

export function MonitoringList({ candidates, patterns }: Props) {
  const navigate = useNavigate();

  if (candidates.length === 0 && patterns.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-warning mb-3 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /> Monitoring ({candidates.length})
      </h2>

      {patterns.length > 0 && (
        <div className="bg-warning/5 border border-warning/20 rounded-xl p-4 mb-3 space-y-2">
          {patterns.map((p, i) => (
            <div key={i} className="flex items-center justify-between">
              <div>
                <span className="font-medium text-sm">{p.orgName}</span>
                <span className="text-xs text-muted-foreground ml-2">{p.description}</span>
              </div>
              <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => navigate(`/organizations`)}>
                View Property
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-card rounded-xl border border-warning/20 divide-y divide-border/50 overflow-hidden">
        {candidates.map((cv) => {
          const vel = VELOCITY_LEVELS[cv.velocity.level];
          const candidate = cv.journey.candidates;
          const org = cv.journey.organizations;
          return (
            <div key={cv.journey.id} className="flex items-center justify-between p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {org?.organization_name || "Unknown"}
                  </span>
                  <span className="font-medium text-sm">{candidate?.full_name}</span>
                  <Badge className={`${vel.bg} ${vel.color} ${vel.border} border text-[10px]`}>
                    {vel.dot} {cv.velocity.score}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Day {cv.journeyDay} · Trend: {cv.velocity.trend}
                </p>
              </div>
              <Button size="sm" variant="ghost" className="gap-1 text-xs h-7" onClick={() => navigate(`/candidate/${candidate?.id}`)}>
                <Eye className="w-3 h-3" /> View
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
