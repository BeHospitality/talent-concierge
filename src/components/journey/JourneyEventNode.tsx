import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, differenceInDays } from "date-fns";
import { CheckCircle2, Circle, Diamond, AlertCircle } from "lucide-react";
import { CompleteEventModal } from "./CompleteEventModal";
import { CheckInCapture } from "@/components/engagement/CheckInCapture";

interface JourneyEvent {
  id: string;
  journey_id?: string | null;
  phase: string;
  event_type: string;
  title: string;
  description: string | null;
  day_offset: number | null;
  scheduled_for: string | null;
  completed_at: string | null;
  status: string;
  assigned_to: string | null;
  priority: string | null;
}

interface JourneyEventNodeProps {
  event: JourneyEvent;
  isCurrentPhase: boolean;
  candidateId?: string;
  candidateName?: string;
  organizationId?: string | null;
  onCompleted: () => void;
}

export function JourneyEventNode({ event, isCurrentPhase, candidateId, candidateName, organizationId, onCompleted }: JourneyEventNodeProps) {
  const [completeOpen, setCompleteOpen] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const isCompleted = event.status === "completed";
  const isSkipped = event.status === "skipped";
  const isMilestone = event.event_type === "milestone";
  const isSystem = event.assigned_to === "system";

  const now = new Date();
  const scheduledDate = event.scheduled_for ? new Date(event.scheduled_for) : null;
  const isOverdue = !isCompleted && !isSkipped && scheduledDate && scheduledDate < now;
  const isDueToday = !isCompleted && !isSkipped && scheduledDate &&
    differenceInDays(scheduledDate, now) === 0 && !isOverdue;
  const daysOverdue = isOverdue && scheduledDate ? differenceInDays(now, scheduledDate) : 0;

  const canMarkComplete = isCurrentPhase && !isCompleted && !isSkipped && !isSystem &&
    (event.status === "active" || event.status === "pending");

  const handleMarkComplete = () => {
    if (event.event_type === "check_in" && candidateId && event.journey_id) {
      setCheckInOpen(true);
    } else {
      setCompleteOpen(true);
    }
  };

  // Node icon
  const renderNode = () => {
    if (isCompleted) return <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />;
    if (isSkipped) return <Circle className="w-4 h-4 text-muted-foreground/40 flex-shrink-0" />;
    if (isOverdue) return <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0 animate-pulse" />;
    if (isMilestone) return <Diamond className="w-4 h-4 text-primary flex-shrink-0" />;
    if (isDueToday || event.status === "active") return <Circle className="w-4 h-4 text-primary flex-shrink-0 animate-pulse" />;
    return <Circle className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />;
  };

  // Status badge
  const renderStatus = () => {
    if (isCompleted) return <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20">✅ Complete</Badge>;
    if (isSkipped) return <Badge variant="outline" className="text-[10px] bg-muted/50 text-muted-foreground border-border/30">Skipped</Badge>;
    if (isOverdue) return <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/20">🔴 {daysOverdue}d overdue</Badge>;
    if (isDueToday) return <Badge variant="outline" className="text-[10px] bg-warning/10 text-warning border-warning/20">⏳ Due today</Badge>;
    if (scheduledDate) return <Badge variant="outline" className="text-[10px] text-muted-foreground">📅 {format(scheduledDate, "MMM d")}</Badge>;
    return <Badge variant="outline" className="text-[10px] text-muted-foreground">⏸️ Pending</Badge>;
  };

  // Assignee badge
  const renderAssignee = () => {
    if (!event.assigned_to) return null;
    const colors: Record<string, string> = {
      manager: "bg-primary/10 text-primary border-primary/20",
      buddy: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      system: "bg-muted/50 text-muted-foreground border-border/30",
      candidate: "bg-success/10 text-success border-success/20",
    };
    return (
      <Badge variant="outline" className={`text-[10px] capitalize ${colors[event.assigned_to] || ""}`}>
        {event.assigned_to}
      </Badge>
    );
  };

  return (
    <>
      <div className={`flex items-start gap-3 py-2 ${isSkipped ? "opacity-40" : ""}`}>
        <div className="flex flex-col items-center pt-0.5">{renderNode()}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`text-sm font-medium ${isCompleted ? "line-through text-muted-foreground" : ""}`}>{event.title}</p>
            {renderStatus()}
            {renderAssignee()}
          </div>
          {event.description && !isSkipped && (
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{event.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            {scheduledDate && <span className="text-[10px] text-muted-foreground">{format(scheduledDate, "MMM d, yyyy")}</span>}
            {event.completed_at && <span className="text-[10px] text-success">Completed {format(new Date(event.completed_at), "MMM d")}</span>}
          </div>
          {canMarkComplete && (
            <Button variant="outline" size="sm" className="mt-1.5 h-7 text-xs gap-1" onClick={handleMarkComplete}>
              Mark Complete
            </Button>
          )}
        </div>
      </div>

      <CompleteEventModal
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        eventId={event.id}
        eventTitle={event.title}
        onCompleted={onCompleted}
      />

      {candidateId && event.journey_id && (
        <CheckInCapture
          open={checkInOpen}
          onOpenChange={setCheckInOpen}
          eventId={event.id}
          eventTitle={event.title}
          candidateId={candidateId}
          candidateName={candidateName || "Candidate"}
          journeyId={event.journey_id}
          organizationId={organizationId}
          dayNumber={event.day_offset ?? 0}
          phase={event.phase}
          onCompleted={onCompleted}
        />
      )}
    </>
  );
}
