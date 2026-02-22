import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { mockOrganizations } from "@/data/mockData";
import { motion } from "framer-motion";
import { Building2, Plus, Users, Download, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function Organizations() {
  const { isDemoMode } = useDemoMode();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ organization_name: "", org_code: "", contact_name: "", contact_email: "", status: "prospect" as string });

  const { data: dbOrgs = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const createOrg = useMutation({
    mutationFn: async (org: typeof form) => {
      const { error } = await supabase.from("organizations").insert([org] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organization added" });
      setAddOpen(false);
      setForm({ organization_name: "", org_code: "", contact_name: "", contact_email: "", status: "prospect" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const orgs = isDemoMode ? mockOrganizations : dbOrgs;

  const statusColor = (s: string) =>
    s === "client" ? "bg-success/20 text-success" : s === "prospect" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

  const handleExportCSV = () => {
    if (orgs.length === 0) {
      toast({ title: "Nothing to export", variant: "destructive" });
      return;
    }
    const headers = ["Organization Name", "Org Code", "Contact Name", "Contact Email", "Status"];
    const rows = orgs.map((o: any) => [
      `"${o.organization_name}"`,
      `"${o.org_code}"`,
      `"${o.contact_name}"`,
      `"${o.contact_email}"`,
      `"${o.status}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r: string[]) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "organizations.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: `${orgs.length} organizations exported to CSV.` });
  };

  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground mt-1">{isDemoMode ? "Viewing demo data" : "Manage B2B client organizations"}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
            <Download className="w-4 h-4" />Export
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 gold-glow-hover"><Plus className="w-4 h-4" />Add Organization</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-lg">
              <DialogHeader><DialogTitle>Add Organization</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createOrg.mutate(form); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Name *</Label><Input value={form.organization_name} onChange={(e) => setForm(f => ({ ...f, organization_name: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Org Code *</Label><Input value={form.org_code} onChange={(e) => setForm(f => ({ ...f, org_code: e.target.value }))} required className="mt-1 bg-muted/50" placeholder="acme-hotels" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Name *</Label><Input value={form.contact_name} onChange={(e) => setForm(f => ({ ...f, contact_name: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Email *</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm(f => ({ ...f, contact_email: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                  <Select value={form.status} onValueChange={(v) => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="mt-1 bg-muted/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prospect">Prospect</SelectItem>
                      <SelectItem value="client">Client</SelectItem>
                      <SelectItem value="churned">Churned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button type="submit" className="gold-glow-hover" disabled={createOrg.isPending}>{createOrg.isPending ? "Adding..." : "Add"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4"><Building2 className="w-8 h-8 text-muted-foreground" /></div>
          <h2 className="text-lg font-semibold mb-2">No organizations yet</h2>
          <p className="text-sm text-muted-foreground mb-6">Add your first organization to start managing client relationships.</p>
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead><tr className="border-b border-border/50">
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Organization</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Code</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Contact</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Status</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Candidates</th>
              {isDemoMode && <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Health</th>}
              <th className="w-10"></th>
            </tr></thead>
            <tbody>
              {orgs.map((org: any, i: number) => (
                <motion.tr key={org.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer group" onClick={() => navigate(`/organizations/${org.id}`)}>
              <td className="px-6 py-4"><div className="flex items-center gap-3"><Building2 className="w-5 h-5 text-primary" /><span className="font-medium text-sm">{org.organization_name}</span></div></td>
                  <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{org.org_code}</td>
                  <td className="px-6 py-4"><p className="text-sm">{org.contact_name}</p><p className="text-xs text-muted-foreground">{org.contact_email}</p></td>
                  <td className="px-6 py-4"><Badge className={`capitalize text-[10px] border-0 ${statusColor(org.status)}`}>{org.status}</Badge></td>
                  <td className="px-6 py-4"><div className="flex items-center gap-1 text-sm"><Users className="w-3.5 h-3.5 text-muted-foreground" />{org.candidates_linked ?? 0}</div></td>
                  {isDemoMode && (org as any).health_score != null && (
                    <td className="px-6 py-4"><span className="text-sm font-semibold">{(org as any).health_score}/100</span></td>
                  )}
                  <td className="px-4 py-4">
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}