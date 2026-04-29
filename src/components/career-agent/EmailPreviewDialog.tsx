import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface EmailPreviewCandidate {
  id: string;
  full_name: string;
  email: string;
  archetype?: string | null;
}

interface Props {
  emailNumber: 1 | 2 | 3 | 4;
  candidate: EmailPreviewCandidate;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSent?: () => void;
}

const EMAIL_META: Record<number, { name: string; subject: string; body: string; sender: string }> = {
  1: {
    name: "Archetype Reveal",
    subject: "{first_name}, your DNA is in",
    body: "Hi {first_name},\n\nYour Hospitality DNA result is ready: {archetype}. Here's what that means for your next move…",
    sender: "John Fingleton, Be Hospitality Solutions <john@be.ie>",
  },
  2: {
    name: "Welcome to Concierge",
    subject: "{first_name}, welcome to your Concierge",
    body: "Hi {first_name},\n\nGreat to see you've stepped into the Concierge. This is where your placement journey takes shape…",
    sender: "John Fingleton, Be Hospitality Solutions <john@be.ie>",
  },
  3: {
    name: "Profile Taking Shape",
    subject: "{first_name}, your profile is taking shape",
    body: "Hi {first_name},\n\nYou're well on your way. Here's what you've completed and what's left to land your placement…",
    sender: "John at Be Connect <john@be.ie>",
  },
  4: {
    name: "Profile Ready",
    subject: "{first_name}, your profile is ready",
    body: "Hi {first_name},\n\nYour profile is complete. We're now matching you to the right hospitality teams…",
    sender: "John at Be Connect <john@be.ie>",
  },
};

function deriveFirstName(fullName: string, email: string): string {
  return (fullName?.trim().split(/\s+/)[0]) || email.split("@")[0];
}

function render(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_m, key) => params[key] ?? `{${key}}`);
}

export function EmailPreviewDialog({ emailNumber, candidate, open, onOpenChange, onSent }: Props) {
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const meta = EMAIL_META[emailNumber];

  const firstName = deriveFirstName(candidate.full_name, candidate.email);
  const archetype = candidate.archetype || "Hospitality DNA Profile";
  const params = { first_name: firstName, archetype };

  const subject = render(meta.subject, params);
  const body = render(meta.body, params).slice(0, 200);

  const handleConfirm = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke(`fire-email-${emailNumber}`, {
        body: { candidate_id: candidate.id, ...(emailNumber === 4 ? { force: true } : {}) },
      });
      if (error) throw new Error(error.message || "Edge function error");
      if (data && data.success === false) {
        throw new Error(data.error || "Email send failed");
      }
      toast.success(`Email #${emailNumber} sent successfully to ${candidate.full_name}`);
      onSent?.();
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Email send failed: ${msg}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Confirm: Send {meta.name} to {candidate.full_name}?
          </DialogTitle>
          <DialogDescription>
            Review the preview below. Nothing fires until you click Confirm and Send.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Email #{emailNumber}</Badge>
            <span className="text-muted-foreground">{meta.name}</span>
          </div>
          <div className="rounded-md border border-border/50 bg-muted/30 p-3 space-y-2">
            <div><span className="text-xs text-muted-foreground uppercase tracking-wider">To</span><p className="font-medium">{candidate.email}</p></div>
            <div><span className="text-xs text-muted-foreground uppercase tracking-wider">From</span><p className="font-medium">{meta.sender}</p></div>
            <div><span className="text-xs text-muted-foreground uppercase tracking-wider">Subject</span><p className="font-semibold">{subject}</p></div>
            <div>
              <span className="text-xs text-muted-foreground uppercase tracking-wider">Preview (first 200 chars)</span>
              <p className="whitespace-pre-wrap text-foreground/90 mt-1">{body}…</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={sending}>
            {sending ? "Sending…" : "Confirm and Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
