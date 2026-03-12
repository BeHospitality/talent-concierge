import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { motion } from "framer-motion";
import { Plus, Users, Mail, Phone, Trash2, Edit, Search } from "lucide-react";
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

export function HiringManagersSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useIsAdmin();
  const [addOpen, setAddOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState<string>("all");
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", department: "", organization_id: "" });

  const { data: managers = [] } = useQuery({
    queryKey: ["all-hiring-managers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hiring_managers")
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

  const addManager = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase.from("hiring_managers").insert({
        organization_id: payload.organization_id,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone || null,
        department: payload.department,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-hiring-managers"] });
      toast({ title: "Hiring manager added" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateManager = useMutation({
    mutationFn: async ({ id, ...updates }: any) => {
      const { error } = await supabase.from("hiring_managers").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-hiring-managers"] });
      toast({ title: "Hiring manager updated" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteManager = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hiring_managers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-hiring-managers"] });
      toast({ title: "Hiring manager removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setAddOpen(false);
    setEditingManager(null);
    setForm({ full_name: "", email: "", phone: "", department: "", organization_id: "" });
  };

  const openEdit = (m: any) => {
    setEditingManager(m);
    setForm({
      full_name: m.full_name,
      email: m.email,
      phone: m.phone || "",
      department: m.department || "",
      organization_id: m.organization_id,
    });
    setAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingManager) {
      updateManager.mutate({ id: editingManager.id, full_name: form.full_name, email: form.email, phone: form.phone || null, department: form.department });
    } else {
      addManager.mutate(form);
    }
  };

  const filtered = managers.filter((m: any) => {
    const matchesSearch = !search || m.full_name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase());
    const matchesOrg = orgFilter === "all" || m.organization_id === orgFilter;
    return matchesSearch && matchesOrg;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{filtered.length} hiring manager{filtered.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="gap-2" onClick={() => { setEditingManager(null); setForm({ full_name: "", email: "", phone: "", department: "", organization_id: "" }); setAddOpen(true); }}>
          <Plus className="w-4 h-4" />Add Hiring Manager
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/50" />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-[220px] bg-muted/50"><SelectValue placeholder="All Organizations" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Organizations</SelectItem>
            {organizations.map((o: any) => (
              <SelectItem key={o.id} value={o.id}>{o.organization_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No hiring managers found.</div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden md:table-cell">Organization</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden lg:table-cell">Department</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m: any, i: number) => (
                <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <span className="font-medium text-sm">{m.full_name}</span>
                        {m.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" />{m.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">{m.email}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <Badge variant="outline" className="text-[10px]">{m.organizations?.organization_name || "—"}</Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden lg:table-cell">{m.department || "—"}</td>
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
                            <AlertDialogDescription>This hiring manager will be permanently removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteManager.mutate(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
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
          <DialogHeader><DialogTitle>{editingManager ? "Edit Hiring Manager" : "Add Hiring Manager"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {!editingManager && (
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Organization *</Label>
                <Select value={form.organization_id} onValueChange={(v) => setForm(f => ({ ...f, organization_id: v }))}>
                  <SelectTrigger className="mt-1 bg-muted/50"><SelectValue placeholder="Select organization" /></SelectTrigger>
                  <SelectContent>
                    {organizations.map((o: any) => (
                      <SelectItem key={o.id} value={o.id}>{o.organization_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required className="mt-1 bg-muted/50" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 bg-muted/50" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Department *</Label>
                <Input value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} required className="mt-1 bg-muted/50" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="gold-glow-hover" disabled={addManager.isPending || updateManager.isPending || (!editingManager && !form.organization_id)}>
                {(addManager.isPending || updateManager.isPending) ? "Saving..." : editingManager ? "Save Changes" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
