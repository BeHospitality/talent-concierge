import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useCandidates, type CandidateInsert } from "@/hooks/useCandidates";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  trigger?: React.ReactNode;
}

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  current_location: "",
  desired_location: "",
  referral_source: "",
};

export default function AddCandidateDialog({ trigger }: Props) {
  const [open, setOpen] = useState(false);
  const { createCandidate, isCreating } = useCandidates();
  const [orgId, setOrgId] = useState<string>("");
  const [form, setForm] = useState<CandidateInsert>({ ...emptyForm, organization_id: "" });

  useEffect(() => {
    supabase.rpc("get_user_org_id").then(({ data }) => {
      if (data) {
        setOrgId(data);
        setForm(f => ({ ...f, organization_id: data }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCandidate(form);
    setForm({ ...emptyForm, organization_id: orgId });
    setOpen(false);
  };

  const update = (field: keyof CandidateInsert, value: string) => setForm((f) => ({ ...f, [field]: value }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm" className="gap-2 gold-glow-hover">
            <Plus className="w-4 h-4" />
            Add Candidate
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-card border-border/50 max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Candidate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name *</Label>
              <Input value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label>
              <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required className="mt-1 bg-muted/50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
              <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Referral Source</Label>
              <Select value={form.referral_source} onValueChange={(v) => update("referral_source", v)}>
                <SelectTrigger className="mt-1 bg-muted/50"><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="Indeed">Indeed</SelectItem>
                  <SelectItem value="Employee Referral">Employee Referral</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Current Location</Label>
              <Input value={form.current_location} onChange={(e) => update("current_location", e.target.value)} className="mt-1 bg-muted/50" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Desired Location</Label>
              <Input value={form.desired_location} onChange={(e) => update("desired_location", e.target.value)} className="mt-1 bg-muted/50" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" className="gold-glow-hover" disabled={isCreating}>
              {isCreating ? "Adding..." : "Add Candidate"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
