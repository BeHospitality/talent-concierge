import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, Users, Mail, Phone, Trash2, Edit, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter as AlertFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

interface HiringManagersTabProps {
  organizationId: string;
}

export function HiringManagersTab({ organizationId }: HiringManagersTabProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    department: "",
    default_pin_preference: "",
  });

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ["org-hiring-managers", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hiring_managers")
        .select("*")
        .eq("organization_id", organizationId)
        .order("full_name");
      if (error) throw error;
      return data;
    },
  });

  const addManager = useMutation({
    mutationFn: async (payload: typeof form) => {
      const { error } = await supabase.from("hiring_managers").insert({
        organization_id: organizationId,
        full_name: payload.full_name,
        email: payload.email,
        phone: payload.phone || null,
        department: payload.department,
        default_pin_preference: payload.default_pin_preference || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-hiring-managers", organizationId] });
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
      queryClient.invalidateQueries({ queryKey: ["org-hiring-managers", organizationId] });
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
      queryClient.invalidateQueries({ queryKey: ["org-hiring-managers", organizationId] });
      toast({ title: "Hiring manager removed" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setAddOpen(false);
    setEditingManager(null);
    setForm({ full_name: "", email: "", phone: "", department: "", default_pin_preference: "" });
  };

  const openEdit = (m: any) => {
    setEditingManager(m);
    setForm({
      full_name: m.full_name,
      email: m.email,
      phone: m.phone || "",
      department: m.department || "",
      default_pin_preference: m.default_pin_preference || "",
    });
    setAddOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingManager) {
      updateManager.mutate({ id: editingManager.id, ...form, phone: form.phone || null, default_pin_preference: form.default_pin_preference || null });
    } else {
      addManager.mutate(form);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">
          {managers.length} hiring manager{managers.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" className="gap-2" onClick={() => { setEditingManager(null); setForm({ full_name: "", email: "", phone: "", department: "", default_pin_preference: "" }); setAddOpen(true); }}>
          <Plus className="w-4 h-4" />Add Hiring Manager
        </Button>
      </div>

      {managers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          No hiring managers yet. Add one to start sending dossiers.
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden sm:table-cell">Email</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden md:table-cell">Phone</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden md:table-cell">Department</th>
                <th className="text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {managers.map((m: any, i: number) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/30 hover:bg-accent/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden sm:table-cell">
                    <div className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" />{m.email}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">
                    {m.phone ? (
                      <div className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{m.phone}</div>
                    ) : "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground hidden md:table-cell">{m.department || "—"}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(m)}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive">
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-card border-border/50">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Remove {m.full_name}?</AlertDialogTitle>
                            <AlertDialogDescription>This hiring manager will be removed from this organization.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteManager.mutate(m.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
                          </AlertFooter>
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

      {/* Add/Edit Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setAddOpen(true); }}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingManager ? "Edit Hiring Manager" : "Add Hiring Manager"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name *</Label>
                <Input value={form.full_name} onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))} required className="mt-1 bg-muted/50" placeholder="Sarah McCarthy" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} required className="mt-1 bg-muted/50" placeholder="sarah@hotel.com" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone</Label>
                <Input type="tel" value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1 bg-muted/50" placeholder="+353..." />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Department *</Label>
                <Input value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} required className="mt-1 bg-muted/50" placeholder="Human Resources" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="gold-glow-hover" disabled={addManager.isPending || updateManager.isPending}>
                {(addManager.isPending || updateManager.isPending) ? "Saving..." : editingManager ? "Save Changes" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
