import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Copy, Check, Eye, FileText, RefreshCw, Mail, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

const BOOKING_URL = "https://calendar.app.google/jnoS2WB8um1GHo1S9";

function generateCode(len = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}
function generatePin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

interface ReportFormData {
  property_name: string;
  manager_name: string;
  manager_email: string;
  pin: string;
  organization_id: string;
  // Audit
  staff_count: string;
  turnover_rate: string;
  annual_cost: string;
  daily_bleed: string;
  cost_per_departure: string;
  departures_per_year: string;
  invisible_percent: string;
  // Vibe
  overall_score: string;
  risk_level: string;
  response_count: string;
  total_staff: string;
  response_rate: string;
  q1: string; q2: string; q3: string; q4: string;
  // Analysis
  headline: string;
  summary: string;
  weakest_name: string; weakest_score: string; weakest_insight: string;
  strongest_name: string; strongest_score: string; strongest_insight: string;
  // Recommendations
  recommendations: { title: string; impact: string; effort: string; description: string }[];
}

const emptyForm: ReportFormData = {
  property_name: "", manager_name: "", manager_email: "", pin: generatePin(), organization_id: "",
  staff_count: "", turnover_rate: "", annual_cost: "", daily_bleed: "", cost_per_departure: "", departures_per_year: "", invisible_percent: "",
  overall_score: "", risk_level: "at_risk", response_count: "", total_staff: "", response_rate: "",
  q1: "", q2: "", q3: "", q4: "",
  headline: "", summary: "",
  weakest_name: "", weakest_score: "", weakest_insight: "",
  strongest_name: "", strongest_score: "", strongest_insight: "",
  recommendations: [{ title: "", impact: "", effort: "Low", description: "" }],
};

export default function AdminDossiers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ReportFormData>({ ...emptyForm });
  const [published, setPublished] = useState<{ code: string; pin: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["admin_insight_reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: orgs = [] } = useQuery({
    queryKey: ["organizations_list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("id, organization_name").order("organization_name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (action: "draft" | "publish") => {
      const code = generateCode();
      const reportData: any = {};

      // Audit
      if (form.annual_cost || form.staff_count) {
        reportData.audit = {
          staff_count: Number(form.staff_count) || 0,
          turnover_rate: Number(form.turnover_rate) || 0,
          annual_cost: Number(form.annual_cost) || 0,
          daily_bleed: Number(form.daily_bleed) || 0,
          cost_per_departure: Number(form.cost_per_departure) || 0,
          departures_per_year: Number(form.departures_per_year) || 0,
          invisible_percent: Number(form.invisible_percent) || 0,
        };
      }

      // Vibe
      if (form.overall_score) {
        reportData.vibe_check = {
          overall_score: Number(form.overall_score) || 0,
          risk_level: form.risk_level,
          response_count: Number(form.response_count) || 0,
          total_staff: Number(form.total_staff) || 0,
          response_rate: Number(form.response_rate) || 0,
          questions: [
            { name: "Team Energy", avg: Number(form.q1) || 0, label: labelFor(Number(form.q1) || 0) },
            { name: "Management Support", avg: Number(form.q2) || 0, label: labelFor(Number(form.q2) || 0) },
            { name: "Growth Potential", avg: Number(form.q3) || 0, label: labelFor(Number(form.q3) || 0) },
            { name: "Team Spirit", avg: Number(form.q4) || 0, label: labelFor(Number(form.q4) || 0) },
          ],
        };
      }

      // Analysis
      if (form.headline) {
        reportData.analysis = {
          headline: form.headline,
          summary: form.summary,
          weakest_area: form.weakest_name ? { name: form.weakest_name, score: Number(form.weakest_score) || 0, insight: form.weakest_insight } : undefined,
          strongest_area: form.strongest_name ? { name: form.strongest_name, score: Number(form.strongest_score) || 0, insight: form.strongest_insight } : undefined,
        };
      }

      // Recommendations
      const recs = form.recommendations.filter(r => r.title);
      if (recs.length) reportData.recommendations = recs;

      reportData.created_by = "Be Connect Team";
      reportData.created_at = new Date().toISOString().split("T")[0];

      const record = {
        access_code: code,
        pin: form.pin,
        property_name: form.property_name,
        manager_name: form.manager_name,
        manager_email: form.manager_email || null,
        organization_id: form.organization_id || null,
        report_data: reportData,
        status: action === "publish" ? "published" : "draft",
        published_at: action === "publish" ? new Date().toISOString() : null,
      };

      const { error } = await supabase.from("insight_reports").insert(record);
      if (error) throw error;
      return { code, pin: form.pin };
    },
    onSuccess: (result, action) => {
      queryClient.invalidateQueries({ queryKey: ["admin_insight_reports"] });
      if (action === "publish") {
        setPublished(result);
      } else {
        toast({ title: "Draft saved" });
        setOpen(false);
        setForm({ ...emptyForm, pin: generatePin() });
      }
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insight_reports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_insight_reports"] });
      toast({ title: "Dossier deleted" });
    },
  });

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const appUrl = window.location.origin;

  const getEmailTemplate = (code: string, pin: string) =>
    `Subject: Your ${form.property_name} Team Insights Are Ready\n\nHi ${form.manager_name},\n\nYour confidential team report is ready.\n\n📊 ${appUrl}/insights/${code}\n🔒 PIN: ${pin}\n\nReady to discuss? Book a 30-minute session:\n${BOOKING_URL}\n\nBest,\nBe Connect Team`;

  const updateField = (key: keyof ReportFormData, value: any) => setForm(f => ({ ...f, [key]: value }));

  const addRec = () => setForm(f => ({ ...f, recommendations: [...f.recommendations, { title: "", impact: "", effort: "Low", description: "" }] }));
  const updateRec = (i: number, key: string, value: string) =>
    setForm(f => ({ ...f, recommendations: f.recommendations.map((r, idx) => idx === i ? { ...r, [key]: value } : r) }));
  const removeRec = (i: number) => setForm(f => ({ ...f, recommendations: f.recommendations.filter((_, idx) => idx !== i) }));

  const statusBadge = (s: string) => {
    const map: Record<string, "default" | "secondary" | "destructive"> = { published: "default", draft: "secondary", viewed: "default", archived: "destructive" };
    return <Badge variant={map[s] || "secondary"} className="text-[10px] capitalize">{s}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Dossiers
          </h1>
          <p className="text-sm text-muted-foreground">Create and manage property insight reports</p>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setPublished(null); setForm({ ...emptyForm, pin: generatePin() }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2 gold-glow-hover">
              <Plus className="w-4 h-4" />Create Dossier
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border/50 max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{published ? "✅ Dossier Published!" : "Create New Dossier"}</DialogTitle>
            </DialogHeader>

            {published ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="bg-success/10 border border-success/30 rounded-lg p-6 text-center">
                  <Check className="w-10 h-10 text-success mx-auto mb-2" />
                  <p className="font-bold text-success">Dossier Published</p>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Link</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={`${appUrl}/insights/${published.code}`} readOnly className="font-mono text-xs bg-muted/50" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(`${appUrl}/insights/${published.code}`, "link")}>
                      {copiedField === "link" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">PIN</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Input value={published.pin} readOnly className="font-mono text-lg font-bold bg-muted/50 w-32" />
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(published.pin, "pin")}>
                      {copiedField === "pin" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="gap-2 w-full" onClick={() => copyToClipboard(getEmailTemplate(published.code, published.pin), "email")}>
                  <Mail className="w-4 h-4" />
                  {copiedField === "email" ? "Email Template Copied!" : "Copy Email Template"}
                </Button>
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => { setOpen(false); setPublished(null); setForm({ ...emptyForm, pin: generatePin() }); }}>Done</Button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs">Property Name *</Label>
                    <Input value={form.property_name} onChange={e => updateField("property_name", e.target.value)} className="mt-1 bg-muted/50" />
                  </div>
                  <div>
                    <Label className="text-xs">Manager Name *</Label>
                    <Input value={form.manager_name} onChange={e => updateField("manager_name", e.target.value)} className="mt-1 bg-muted/50" />
                  </div>
                  <div>
                    <Label className="text-xs">Manager Email</Label>
                    <Input value={form.manager_email} onChange={e => updateField("manager_email", e.target.value)} className="mt-1 bg-muted/50" />
                  </div>
                  <div>
                    <Label className="text-xs">Organization</Label>
                    <Select value={form.organization_id} onValueChange={v => updateField("organization_id", v)}>
                      <SelectTrigger className="mt-1 bg-muted/50"><SelectValue placeholder="Select..." /></SelectTrigger>
                      <SelectContent>
                        {orgs.map(o => <SelectItem key={o.id} value={o.id}>{o.organization_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div>
                    <Label className="text-xs">PIN (4 digits)</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={form.pin} onChange={e => updateField("pin", e.target.value.replace(/\D/g, "").slice(0, 4))} className="w-24 font-mono text-lg font-bold bg-muted/50 text-center" />
                      <Button size="sm" variant="ghost" onClick={() => updateField("pin", generatePin())}><RefreshCw className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                </div>

                {/* Audit Data */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">── Audit Data ──</p>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      ["staff_count", "Staff Count"],
                      ["turnover_rate", "Turnover Rate (%)"],
                      ["annual_cost", "Annual Cost (€)"],
                      ["daily_bleed", "Daily Bleed (€)"],
                      ["cost_per_departure", "Cost Per Departure (€)"],
                      ["departures_per_year", "Departures / Year"],
                      ["invisible_percent", "Invisible Cost (%)"],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <Label className="text-[10px]">{label}</Label>
                        <Input value={(form as any)[key]} onChange={e => updateField(key as any, e.target.value)} className="mt-1 bg-muted/50" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vibe Check */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">── Vibe Check Data ──</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label className="text-[10px]">Overall Score</Label>
                      <Input value={form.overall_score} onChange={e => updateField("overall_score", e.target.value)} className="mt-1 bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Risk Level</Label>
                      <Select value={form.risk_level} onValueChange={v => updateField("risk_level", v)}>
                        <SelectTrigger className="mt-1 bg-muted/50"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="healthy">Healthy</SelectItem>
                          <SelectItem value="stable">Stable</SelectItem>
                          <SelectItem value="at_risk">At Risk</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px]">Response Rate (%)</Label>
                      <Input value={form.response_rate} onChange={e => updateField("response_rate", e.target.value)} className="mt-1 bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Response Count</Label>
                      <Input value={form.response_count} onChange={e => updateField("response_count", e.target.value)} className="mt-1 bg-muted/50" />
                    </div>
                    <div>
                      <Label className="text-[10px]">Total Staff</Label>
                      <Input value={form.total_staff} onChange={e => updateField("total_staff", e.target.value)} className="mt-1 bg-muted/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    {[["q1", "Q1 Energy"], ["q2", "Q2 Support"], ["q3", "Q3 Growth"], ["q4", "Q4 Spirit"]].map(([key, label]) => (
                      <div key={key}>
                        <Label className="text-[10px]">{label}</Label>
                        <Input value={(form as any)[key]} onChange={e => updateField(key as any, e.target.value)} className="mt-1 bg-muted/50" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analysis */}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">── Analysis ──</p>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-[10px]">Headline</Label>
                      <Input value={form.headline} onChange={e => updateField("headline", e.target.value)} className="mt-1 bg-muted/50" placeholder="You have a retention problem..." />
                    </div>
                    <div>
                      <Label className="text-[10px]">Summary</Label>
                      <Textarea value={form.summary} onChange={e => updateField("summary", e.target.value)} className="mt-1 bg-muted/50 min-h-[60px]" />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-[10px]">Weakest Area</Label><Input value={form.weakest_name} onChange={e => updateField("weakest_name", e.target.value)} className="mt-1 bg-muted/50" /></div>
                      <div><Label className="text-[10px]">Score</Label><Input value={form.weakest_score} onChange={e => updateField("weakest_score", e.target.value)} className="mt-1 bg-muted/50" /></div>
                      <div><Label className="text-[10px]">Insight</Label><Input value={form.weakest_insight} onChange={e => updateField("weakest_insight", e.target.value)} className="mt-1 bg-muted/50" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-[10px]">Strongest Area</Label><Input value={form.strongest_name} onChange={e => updateField("strongest_name", e.target.value)} className="mt-1 bg-muted/50" /></div>
                      <div><Label className="text-[10px]">Score</Label><Input value={form.strongest_score} onChange={e => updateField("strongest_score", e.target.value)} className="mt-1 bg-muted/50" /></div>
                      <div><Label className="text-[10px]">Insight</Label><Input value={form.strongest_insight} onChange={e => updateField("strongest_insight", e.target.value)} className="mt-1 bg-muted/50" /></div>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">── Recommendations ──</p>
                    <Button size="sm" variant="ghost" onClick={addRec} className="gap-1 text-xs"><Plus className="w-3 h-3" />Add</Button>
                  </div>
                  <div className="space-y-3">
                    {form.recommendations.map((rec, i) => (
                      <div key={i} className="grid grid-cols-12 gap-2 items-start">
                        <span className="col-span-1 text-sm font-bold text-muted-foreground pt-7">{i + 1}.</span>
                        <div className="col-span-3"><Label className="text-[10px]">Title</Label><Input value={rec.title} onChange={e => updateRec(i, "title", e.target.value)} className="mt-1 bg-muted/50" /></div>
                        <div className="col-span-3"><Label className="text-[10px]">Impact</Label><Input value={rec.impact} onChange={e => updateRec(i, "impact", e.target.value)} className="mt-1 bg-muted/50" /></div>
                        <div className="col-span-2">
                          <Label className="text-[10px]">Effort</Label>
                          <Select value={rec.effort} onValueChange={v => updateRec(i, "effort", v)}>
                            <SelectTrigger className="mt-1 bg-muted/50"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Low">Low</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2"><Label className="text-[10px]">Description</Label><Input value={rec.description} onChange={e => updateRec(i, "description", e.target.value)} className="mt-1 bg-muted/50" /></div>
                        <div className="col-span-1 pt-6">
                          {form.recommendations.length > 1 && (
                            <Button size="sm" variant="ghost" onClick={() => removeRec(i)}><Trash2 className="w-3 h-3 text-muted-foreground" /></Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
                  <Button variant="outline" onClick={() => saveMutation.mutate("draft")} disabled={!form.property_name || !form.manager_name || saveMutation.isPending}>
                    Save Draft
                  </Button>
                  <Button className="gold-glow-hover" onClick={() => saveMutation.mutate("publish")} disabled={!form.property_name || !form.manager_name || !form.pin || saveMutation.isPending}>
                    {saveMutation.isPending ? "Publishing…" : "Publish & Generate Link"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Table */}
      <Card className="bg-card/80 border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Views</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
              ) : reports.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No dossiers yet. Create your first one.</TableCell></TableRow>
              ) : (
                reports.map((r: any) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.property_name}</TableCell>
                    <TableCell>{r.manager_name}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                    <TableCell className="text-center">{r.view_count || 0}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "short" })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "published" && (
                          <>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(`${appUrl}/insights/${r.access_code}`, r.id)}>
                              {copiedField === r.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            </Button>
                            <Button size="sm" variant="ghost" asChild>
                              <a href={`/insights/${r.access_code}`} target="_blank"><Eye className="w-3.5 h-3.5" /></a>
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(r.id)}>
                          <Trash2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function labelFor(score: number): string {
  if (score >= 4) return "Strong";
  if (score >= 3) return "Stable";
  if (score >= 2) return "At Risk";
  return "Critical";
}
