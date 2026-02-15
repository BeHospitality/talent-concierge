import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Send, Mail, MessageSquare, Smartphone, Link as LinkIcon, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface SendAssessmentDialogProps {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  organizationName?: string;
  jobTitle?: string;
  isDemoMode: boolean;
}

export function SendAssessmentDialog({
  candidateId, candidateName, candidateEmail, candidatePhone,
  organizationName = "Client Organization", jobTitle = "Position", isDemoMode,
}: SendAssessmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [sentVia, setSentVia] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const token = crypto.randomUUID().slice(0, 12);
  const assessmentUrl = `tribe.be.ie/assess?token=${token}`;
  const managerName = "Your Concierge";

  const defaultMessage = `Hi ${candidateName},

Great speaking with you about the ${jobTitle} opportunity at ${organizationName}!

Next step: Complete your DNA profile (takes 15 minutes):

${assessmentUrl}

This helps us match you with the right team and role.

Questions? Reply to this message.

Best,
${managerName}
Be Connect`;

  const [message, setMessage] = useState(defaultMessage);

  const { data: existingLinks = [] } = useQuery({
    queryKey: ["assessment_links", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("assessment_links")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const sendMutation = useMutation({
    mutationFn: async (via: string) => {
      const { error } = await supabase.from("assessment_links").insert({
        candidate_id: candidateId,
        token,
        assessment_url: assessmentUrl,
        sent_via: via,
      });
      if (error) throw error;
    },
    onSuccess: (_, via) => {
      queryClient.invalidateQueries({ queryKey: ["assessment_links", candidateId] });
      setSentVia(via);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleEmail = () => {
    if (!isDemoMode) sendMutation.mutate("email");
    const subject = encodeURIComponent(`Complete Your Be Connect Profile - ${jobTitle}`);
    const body = encodeURIComponent(message);
    window.open(`mailto:${candidateEmail}?subject=${subject}&body=${body}`, "_blank");
    toast({ title: "Email client opened", description: `Sending to ${candidateEmail}` });
  };

  const handleWhatsApp = () => {
    if (!candidatePhone) return;
    if (!isDemoMode) sendMutation.mutate("whatsapp");
    const encoded = encodeURIComponent(message);
    const phone = candidatePhone.replace(/[^0-9+]/g, "");
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
    toast({ title: "WhatsApp opened" });
  };

  const handleSMS = () => {
    if (!candidatePhone) return;
    if (!isDemoMode) sendMutation.mutate("sms");
    const encoded = encodeURIComponent(message);
    const phone = candidatePhone.replace(/[^0-9+]/g, "");
    window.open(`sms:${phone}?body=${encoded}`, "_blank");
    toast({ title: "SMS app opened" });
  };

  const handleCopyLink = () => {
    if (!isDemoMode) sendMutation.mutate("manual");
    navigator.clipboard.writeText(assessmentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Assessment link copied!" });
  };

  const lastSent = isDemoMode
    ? { sent_via: "email", sent_at: "2026-02-12T10:00:00Z" }
    : existingLinks[0];

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setSentVia(null); setCopied(false); } }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2 gold-glow-hover">
          <Send className="w-4 h-4" />Send Pre-Screening Assessment
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Assessment to {candidateName}</DialogTitle>
        </DialogHeader>

        {sentVia ? (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
            <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center">
              <Check className="w-10 h-10 text-success mx-auto mb-2" />
              <p className="text-sm font-semibold text-success">Assessment Sent via {sentVia}</p>
              <p className="text-xs text-muted-foreground mt-1">Link expires in 7 days</p>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Assessment Link</Label>
              <div className="flex items-center gap-2 mt-1">
                <Input value={assessmentUrl} readOnly className="bg-muted/50 font-mono text-xs" />
                <Button size="sm" variant="outline" onClick={handleCopyLink}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setOpen(false)}>Done</Button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {lastSent && (
              <div className="bg-muted/30 rounded-lg p-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px]">Previously sent</Badge>
                <span className="text-xs text-muted-foreground">
                  via {(lastSent as any).sent_via} on {new Date((lastSent as any).sent_at).toLocaleDateString()}
                </span>
              </div>
            )}

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Message Template</Label>
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)}
                className="mt-1 bg-muted/50 min-h-[200px] font-mono text-xs" />
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-3 block">Delivery Method</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={handleEmail}>
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="text-xs font-semibold">Send via Email</span>
                  <span className="text-[10px] text-muted-foreground">{candidateEmail}</span>
                </Button>
                <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={handleWhatsApp}
                  disabled={!candidatePhone}>
                  <MessageSquare className="w-5 h-5 text-success" />
                  <span className="text-xs font-semibold">Send via WhatsApp</span>
                  <span className="text-[10px] text-muted-foreground">{candidatePhone || "No phone"}</span>
                </Button>
                <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={handleSMS}
                  disabled={!candidatePhone}>
                  <Smartphone className="w-5 h-5 text-warning" />
                  <span className="text-xs font-semibold">Send via SMS</span>
                  <span className="text-[10px] text-muted-foreground">{candidatePhone || "No phone"}</span>
                </Button>
                <Button variant="outline" className="gap-2 h-auto py-3 flex-col" onClick={handleCopyLink}>
                  <LinkIcon className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs font-semibold">Copy Link</span>
                  <span className="text-[10px] text-muted-foreground">Manual sharing</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
