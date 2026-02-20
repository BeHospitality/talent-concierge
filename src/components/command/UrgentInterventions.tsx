import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Eye, Phone, FileText, CheckCircle2 } from "lucide-react";
import { VELOCITY_LEVELS, MOOD_EMOJIS } from "@/utils/velocityScoring";
import { CHURN_RISK_COLORS } from "@/utils/churnPrediction";
import { InterventionLogModal } from "./InterventionLogModal";
import type { CandidateVelocity } from "@/hooks/useCommandCentre";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Props {
  candidates: CandidateVelocity[];
  onLogged: () => void;
}

export function UrgentInterventions({ candidates, onLogged }: Props) {
  const navigate = useNavigate();
  const [modal, setModal] = useState<CandidateVelocity | null>(null);

  if (candidates.length === 0) {
    return (
      <div className="bg-success/10 border border-success/30 rounded-xl p-6 text-center mb-6">
        <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
        <p className="text-sm font-medium text-success">No urgent interventions needed.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-destructive mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4" /> Urgent Interventions ({candidates.length})
      </h2>
      <div className="bg-card rounded-xl border border-destructive/20 divide-y divide-border/50 overflow-hidden">
        {candidates.map((cv) => {
          const vel = VELOCITY_LEVELS[cv.velocity.level];
          const moodEmoji = cv.latestCheckin ? MOOD_EMOJIS[cv.latestCheckin.mood - 1] : "❓";
          const org = cv.journey.organizations;
          const candidate = cv.journey.candidates;

          return (
            <div key={cv.journey.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
                    {org?.organization_name || "Unknown"}
                  </span>
                  <span className="font-semibold text-sm">{candidate?.full_name || "Unknown"}</span>
                  <span className="text-xs text-muted-foreground">· Day {cv.journeyDay}</span>
                </div>
                <Badge className={`${vel.bg} ${vel.color} ${vel.border} border`}>
                  {vel.dot} {cv.velocity.score}
                </Badge>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>Status: {moodEmoji} {cv.latestCheckin ? MOOD_EMOJIS[cv.latestCheckin.mood - 1] : "No data"}</span>
                {cv.latestCheckin && (
                  <span>Last check-in: Day {cv.latestCheckin.day_number}</span>
                )}
              </div>

              {cv.velocity.riskFactors.length > 0 && (
                <p className="text-xs text-destructive">
                  {cv.velocity.riskFactors.join(" · ")}
                </p>
              )}

              {cv.churnPrediction && cv.churnPrediction.probability >= 25 && (
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-semibold ${CHURN_RISK_COLORS[cv.churnPrediction.riskLevel].text}`}>
                    📈 6-Week Risk: {cv.churnPrediction.probability}% ({cv.churnPrediction.riskLevel.toUpperCase()})
                  </span>
                </div>
              )}

              {cv.velocity.recommendations.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  💡 {cv.velocity.recommendations[0]}
                </p>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => setModal(cv)}>
                  <FileText className="w-3 h-3" /> Log Intervention
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1 text-xs h-7"
                  onClick={() => navigate(`/candidate/${candidate?.id}`)}
                >
                  <Eye className="w-3 h-3" /> View Journey
                </Button>
                {org?.contact_phone && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="ghost" className="gap-1 text-xs h-7">
                        <Phone className="w-3 h-3" /> Call Manager
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3 text-xs">
                      <p className="font-medium">{org.contact_name}</p>
                      <p>{org.contact_phone}</p>
                      <p className="text-muted-foreground">{org.contact_email}</p>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modal && (
        <InterventionLogModal
          open={!!modal}
          onOpenChange={() => setModal(null)}
          candidateId={modal.journey.candidates?.id || ""}
          candidateName={modal.journey.candidates?.full_name || "Unknown"}
          organizationId={modal.journey.organization_id}
          organizationName={modal.journey.organizations?.organization_name || "Unknown"}
          journeyId={modal.journey.id}
          onLogged={onLogged}
        />
      )}
    </div>
  );
}
