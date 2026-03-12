import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Plus, ListChecks, Trash2, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TemplateItem {
  title: string;
}

export function ChecklistTemplatesSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateName, setTemplateName] = useState("");
  const [items, setItems] = useState<TemplateItem[]>([{ title: "" }]);

  const { data: templates = [] } = useQuery({
    queryKey: ["checklist-templates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("checklist_templates").select("*").order("template_name");
      if (error) throw error;
      return data;
    },
  });

  const saveTemplate = useMutation({
    mutationFn: async () => {
      const validItems = items.filter(i => i.title.trim());
      if (!templateName.trim() || validItems.length === 0) throw new Error("Name and at least one item required");
      if (editingTemplate) {
        const { error } = await supabase.from("checklist_templates").update({ template_name: templateName, items: validItems }).eq("id", editingTemplate.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("checklist_templates").insert({ template_name: templateName, items: validItems });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast({ title: editingTemplate ? "Template updated" : "Template created" });
      closeDialog();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["checklist-templates"] });
      toast({ title: "Template deleted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingTemplate(null);
    setTemplateName("");
    setItems([{ title: "" }]);
  };

  const openEdit = (t: any) => {
    setEditingTemplate(t);
    setTemplateName(t.template_name);
    const parsed = Array.isArray(t.items) ? t.items as TemplateItem[] : [];
    setItems(parsed.length > 0 ? parsed : [{ title: "" }]);
    setDialogOpen(true);
  };

  const addItem = () => setItems([...items, { title: "" }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, title: string) => setItems(items.map((item, i) => i === idx ? { title } : item));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{templates.length} template{templates.length !== 1 ? "s" : ""}</p>
        <Button size="sm" className="gap-2" onClick={() => { setEditingTemplate(null); setTemplateName(""); setItems([{ title: "" }]); setDialogOpen(true); }}>
          <Plus className="w-4 h-4" />Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((t: any, i: number) => {
          const tItems = Array.isArray(t.items) ? t.items as TemplateItem[] : [];
          return (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="border-border/50 h-full flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <ListChecks className="w-4 h-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm">{t.template_name}</CardTitle>
                      <CardDescription className="text-xs">{tItems.length} item{tItems.length !== 1 ? "s" : ""}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 pb-3">
                  <ul className="text-sm space-y-1">
                    {tItems.slice(0, 4).map((item: TemplateItem, idx: number) => (
                      <li key={idx} className="text-muted-foreground">• {item.title}</li>
                    ))}
                    {tItems.length > 4 && <li className="text-xs text-muted-foreground/60">+ {tItems.length - 4} more</li>}
                  </ul>
                </CardContent>
                <CardFooter className="pt-0 gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                    <Edit className="w-3.5 h-3.5 mr-1" />Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5 mr-1" />Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{t.template_name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This template will be permanently deleted.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteTemplate.mutate(t.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardFooter>
              </Card>
            </motion.div>
          );
        })}

        {/* Create new card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: templates.length * 0.05 }}>
          <Card className="border-dashed border-border/50 h-full flex items-center justify-center min-h-[180px] cursor-pointer hover:bg-accent/20 transition-colors" onClick={() => { setEditingTemplate(null); setTemplateName(""); setItems([{ title: "" }]); setDialogOpen(true); }}>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Plus className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Create Template</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); else setDialogOpen(true); }}>
        <DialogContent className="bg-card border-border/50 max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingTemplate ? "Edit Template" : "Create Template"}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); saveTemplate.mutate(); }} className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Template Name *</Label>
              <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} required className="mt-1 bg-muted/50" placeholder="e.g., Onboarding Checklist" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Checklist Items</Label>
              <div className="space-y-2">
                {items.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input value={item.title} onChange={(e) => updateItem(idx, e.target.value)} placeholder={`Item ${idx + 1}`} className="bg-muted/50" />
                    {items.length > 1 && (
                      <Button type="button" size="icon" variant="ghost" className="h-10 w-10 flex-shrink-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem(idx)}>
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" className="mt-2 gap-1" onClick={addItem}>
                <Plus className="w-3.5 h-3.5" />Add Item
              </Button>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
              <Button type="submit" className="gold-glow-hover" disabled={saveTemplate.isPending}>
                {saveTemplate.isPending ? "Saving..." : editingTemplate ? "Save Changes" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
