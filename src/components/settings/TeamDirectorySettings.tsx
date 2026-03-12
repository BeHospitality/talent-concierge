import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Users, Search, Download, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const archetypeColor = (a: string | null) =>
  a === "lion" ? "bg-primary/20 text-primary" : a === "whale" ? "bg-blue-500/20 text-blue-400" : a === "falcon" ? "bg-success/20 text-success" : "";

export function TeamDirectorySettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<any>(null);
  const [form, setForm] = useState({ full_name: "", email: "", department: "", role: "", organization_id: "" });

  const { data: members = [] } = useQuery({
    queryKey: ["all-team-members"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*, organizations(organization_name)")
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, organization_name").order("organization_name");
      if (error) throw error;
      return data;
    },
  });

  const addMember = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase.from("team_members").insert({
        organization_id: payload.organization_id,
        full_name: payload.full_name,
        email: payload.email,
        department: payload.department,
        role: payload.role,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-team-members"] });
      toast({ title: "Team member added" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("team_members").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-team-members"] });
      toast({ title: "Team member updated" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-team-members"] });
      toast({ title: "Team member removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setAddOpen(false);
    setEditingMember(null);
    setForm({ full_name: "", email: "", department: "", role: "", organization_id: "" });
  };

  const openEdit = (m: any) => {
    setEditingMember(m);
    setForm({ full_name: m.full_name, email: m.email, department: m.department, role: m.role, organization_id: m.organization_id });
    setAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMember.mutate({ id: editingMember.id, full_name: form.full_name, email: form.email, department: form.department, role: form.role });
    } else {
      addMember.mutate(form);
    }
  };

  const roles = [...new Set(members.map((m: any) => m.role).filter(Boolean))];

  const filtered = members.filter((m: any) => {
    const matchesSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchesOrg = orgFilter === "all" || m.organization_id === orgFilter;
    const matchesRole = roleFilter === "all" || m.role === roleFilter;
    return matchesSearch && matchesOrg && matchesRole;
  });

  const exportCsv = () => {
    const headers = ["Name", "Email", "Department", "Role", "Organization", "Archetype"];
    const rows = filtered.map((m: any) => [m.full_name, m.email, m.department, m.role, m.organizations?.organization_name || "", m.tribe_viral_archetype || ""]);
    const csv = [headers.join(","), ...rows.map(r => r.map((v: string) => `"${v}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "team-directory.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} team member{filtered.length !== 1 ? "s" : ""}</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-2" onClick={exportCsv}><Download className="w-4 h-4" />Export CSV</Button>
          <Button size="sm" className="gap-2" onClick={() => { setEditingMember(null); setForm({ full_name: "", email: "", department: "", role: "", organization_id: "" }); setAddOpen(true); }}>
            <Plus className="w-4 h-4" />Add Team Member
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-[200px] bg-muted/50"><SelectValue placeholder="All Organizations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.organization_name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[160px] bg-muted/50"><SelectValue placeholder="All Roles" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((r: string) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No team members found.</div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden sm:table-cell">Department</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden md:table-cell">Role</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden lg:table-cell">Organization</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Archetype</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: any, i: number) => (
                <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                        {m.photo_url ? <img src={m.photo_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 m-2 text-muted-foreground" />}
                      </div>
                      <div>
                        <span className="font-medium text-sm">{m.full_name}</span>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{m.department}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{m.role}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    <Badge variant="outline" className="text-[10px]">{m.organizations?.organization_name || "—"}</Badge>
                  </td>
                  <td className="px-6 py-4">
                    {m.tribe_viral_archetype ? (
                      <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${archetypeColor(m.tribe_viral_archetype)}`}>{m.tribe_viral_archetype}</span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(m)}><Edit className="w-3.5 h-3.5" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border/50">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {m.full_name}?</AlertDialogTitle>
                            <AlertDialogDescription>This team member will be permanently removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMember.mutate(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setAddOpen(true); }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>{editingMember ? "Edit Team Member" : "Add Team Member"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingMember && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Organization *</Label>
                <Select value={form.organization_id} onValueChange={(v) => setForm(f => ({ ...f, organization_id: v }))}>
                  <SelectTrigger className="mt-1 bg-muted/50"><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent>
                    {organizations.map((o: any) => <SelectItem key={o.id} value={o.id}>{o.organization_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name *</Label><Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Department *</Label><Input value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Role *</Label><Input value={form.role} onChange={(e) => setForm(f => ({ ...f, role: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="gold-glow-hover" disabled={addMember.isPending || updateMember.isPending || (!editingMember && !form.organization_id)}>
                {(addMember.isPending || updateMember.isPending) ? "Saving..." : editingMember ? "Save Changes" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
