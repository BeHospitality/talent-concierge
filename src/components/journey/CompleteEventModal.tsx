import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { completeEvent } from "@/utils/journeyHelpers";
import { useToast } from "@/hooks/use-toast";

interface CompleteEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  eventId: string;
  eventTitle: string;
  onCompleted: () => void;
}

export function CompleteEventModal({ open, onOpenChange, eventId, eventTitle, onCompleted }: CompleteEventModalProps) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleComplete = async () => {
    setLoading(true);
    try {
      await completeEvent(eventId, undefined, notes || undefined);
      toast({ title: "Event completed", description: eventTitle });
      onCompleted();
      onOpenChange(false);
      setNotes("");
    } catch {
      toast({ title: "Failed to complete event", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/50 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">Mark Complete</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{eventTitle}</p>
        <div className="space-y-2">
          <Label className="text-xs">Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any notes about this event..."
            className="bg-muted/50 text-sm min-h-[80px]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleComplete} disabled={loading} className="gap-1.5">
            {loading ? "Completing..." : "Complete ✓"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
