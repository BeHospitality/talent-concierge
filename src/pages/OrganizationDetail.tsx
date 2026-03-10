import { useState } from "react";
import AddCandidateDialog from "@/components/dashboard/AddCandidateDialog";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { mockCandidates, mockOrganizations, STAGE_LABELS } from "@/data/mockData";
import { motion } from "framer-motion";
import {
  Building2, ArrowLeft, Users, MapPin, Clock, Edit, Trash2,
  Plus, Route, UserPlus, ChevronRight, Mail, Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { VelocityBadge } from "@/components/engagement/VelocityBadge";

const statusColor = (s: string) =>
  s === "client" ? "bg-success/20 text-success" : s === "prospect" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground";

const archetypeColor = (a: string | null) =>
  a === "lion" ? "bg-primary/20 text-primary" : a === "whale" ? "bg-blue-500/20 text-blue-400" : a === "falcon" ? "bg-success/20 text-success" : "";

export default function OrganizationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDemoMode } = useDemoMode();
  const { isAdmin } = useIsAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ full_name: "", email: "", department: "", role: "" });

  // Fetch organization
  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("organizations").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode && !!id,
  });

  // Fetch candidates
  const { data: candidates = [] } = useQuery({
    queryKey: ["org-candidates", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("*").eq("organization_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode && !!id,
  });

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ["org-team-members", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("team_members").select("*").eq("organization_id", id!).order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode && !!id,
  });

  // Fetch active journeys
  const { data: journeys = [] } = useQuery({
    queryKey: ["org-journeys", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_blueprints")
        .select("*, candidates(full_name, photo_url, current_stage)")
        .eq("organization_id", id!)
        .eq("status", "active")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode && !!id,
  });

  // Edit form state
  const [editForm, setEditForm] = useState<any>(null);

  const updateOrg = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from("organizations").update(updates).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", id] });
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organization updated" });
      setEditOpen(false);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteOrg = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("organizations").delete().eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      toast({ title: "Organization deleted" });
      navigate("/organizations");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addTeamMember = useMutation({
    mutationFn: async (member: typeof memberForm) => {
      const { error } = await supabase.from("team_members").insert([{ ...member, organization_id: id }] as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-team-members", id] });
      toast({ title: "Team member added" });
      setAddMemberOpen(false);
      setMemberForm({ full_name: "", email: "", department: "", role: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Demo mode
  const demoOrg = isDemoMode ? mockOrganizations.find(o => o.id === id) : null;
  const demoCandidates = isDemoMode ? mockCandidates.filter(c => c.organization_id === id) : [];
  const displayOrg = isDemoMode ? demoOrg : org;
  const displayCandidates = isDemoMode ? demoCandidates : candidates;
  const displayTeamMembers = isDemoMode ? [] : teamMembers;
  const displayJourneys = isDemoMode ? [] : journeys;

  if (!isDemoMode && orgLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-bold text-sm">S</span>
        </div>
      </div>
    );
  }

  if (!displayOrg) {
    return (
      <div className="max-w-[1600px] mx-auto text-center py-24">
        <h2 className="text-lg font-semibold mb-2">Organization not found</h2>
        <Button variant="outline" onClick={() => navigate("/organizations")}>
          <ArrowLeft className="w-4 h-4 mr-2" />Back to Organizations
        </Button>
      </div>
    );
  }

  const activeJourneyCount = displayJourneys.length;

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Back nav */}
      <Link to="/organizations" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />Organizations
      </Link>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Building2 className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{displayOrg.organization_name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <span className="text-sm text-muted-foreground font-mono">{displayOrg.org_code}</span>
              <Badge className={`capitalize text-[10px] border-0 ${statusColor(displayOrg.status)}`}>{displayOrg.status}</Badge>
            </div>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Mail className="w-3.5 h-3.5" />
              <span>{displayOrg.contact_name} · {displayOrg.contact_email}</span>
            </div>
          </div>
        </div>
        <Button size="sm" variant="outline" className="gap-2 self-start" onClick={() => { setEditForm({ organization_name: displayOrg.organization_name, org_code: displayOrg.org_code, contact_name: displayOrg.contact_name, contact_email: displayOrg.contact_email, status: displayOrg.status }); setEditOpen(true); }}>
          <Edit className="w-4 h-4" />Edit
        </Button>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Candidates", value: displayCandidates.length, icon: Users },
          { label: "Active Journeys", value: activeJourneyCount, icon: Route },
          { label: "Avg Engagement", value: displayCandidates.length > 0 ? Math.round(displayCandidates.reduce((sum: number, c: any) => sum + (c.engagement_score || 0), 0) / displayCandidates.length) + "%" : "—", icon: Clock },
          { label: "Team Members", value: displayTeamMembers.length, icon: UserPlus },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="candidates">
        <TabsList className="mb-6">
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          <TabsTrigger value="journeys">Journeys</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Candidates Tab */}
        <TabsContent value="candidates">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{displayCandidates.length} candidate{displayCandidates.length !== 1 ? "s" : ""}</p>
            <Button size="sm" className="gap-2" onClick={() => navigate(`/`)}>
              <Plus className="w-4 h-4" />Add Candidate
            </Button>
          </div>
          {displayCandidates.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No candidates yet for this organization.</div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Name</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden sm:table-cell">Stage</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden md:table-cell">Location</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Engagement</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayCandidates.map((c: any, i: number) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => navigate(`/candidate/${c.id}`)}
                      className="border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted overflow-hidden flex-shrink-0">
                            {c.photo_url ? <img src={c.photo_url} alt="" className="w-full h-full object-cover" /> : <Users className="w-4 h-4 m-2 text-muted-foreground" />}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{c.full_name}</span>
                            {(c as any).archetype && (
                              <span className={`ml-2 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${archetypeColor((c as any).archetype)}`}>
                                {(c as any).archetype}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
                          {STAGE_LABELS[c.current_stage as keyof typeof STAGE_LABELS] || c.current_stage}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="w-3.5 h-3.5" />
                          {c.desired_location || c.current_location || "—"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${c.risk_level === "high" ? "bg-destructive" : c.risk_level === "medium" ? "bg-warning" : "bg-success"}`} />
                          <span className={`text-sm font-semibold ${c.risk_level === "high" ? "text-destructive" : c.risk_level === "medium" ? "text-warning" : "text-success"}`}>
                            {c.engagement_score}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Team Members Tab */}
        <TabsContent value="team">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">{displayTeamMembers.length} team member{displayTeamMembers.length !== 1 ? "s" : ""}</p>
            <Button size="sm" className="gap-2" onClick={() => setAddMemberOpen(true)}>
              <Plus className="w-4 h-4" />Add Team Member
            </Button>
          </div>
          {displayTeamMembers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No team members yet.</div>
          ) : (
            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Name</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden sm:table-cell">Department</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3 hidden md:table-cell">Role</th>
                    <th className="text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground px-6 py-3">Archetype</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTeamMembers.map((m: any, i: number) => (
                    <motion.tr key={m.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
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
                      <td className="px-6 py-4">
                        {m.tribe_viral_archetype ? (
                          <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${archetypeColor(m.tribe_viral_archetype)}`}>
                            {m.tribe_viral_archetype}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Journeys Tab */}
        <TabsContent value="journeys">
          <p className="text-sm text-muted-foreground mb-4">{activeJourneyCount} active journey{activeJourneyCount !== 1 ? "s" : ""}</p>
          {displayJourneys.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm">No active journeys for this organization.</div>
          ) : (
            <div className="grid gap-3">
              {displayJourneys.map((j: any) => (
                <Card key={j.id} className="border-border/50 hover:bg-accent/20 transition-colors cursor-pointer" onClick={() => navigate("/journeys")}>
                  <CardContent className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Route className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium text-sm">{j.candidates?.full_name || "Unknown candidate"}</p>
                        <p className="text-xs text-muted-foreground">Phase: <span className="capitalize">{j.current_phase}</span></p>
                      </div>
                    </div>
                    <Badge className="text-[10px] border-0 bg-success/20 text-success capitalize">{j.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="max-w-xl space-y-6">
            <Card className="border-border/50">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Settings2 className="w-4 h-4" />Organization Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Name</Label><p className="text-sm mt-1">{displayOrg.organization_name}</p></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Org Code</Label><p className="text-sm mt-1 font-mono">{displayOrg.org_code}</p></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Name</Label><p className="text-sm mt-1">{displayOrg.contact_name}</p></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Email</Label><p className="text-sm mt-1">{displayOrg.contact_email}</p></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label><Badge className={`mt-1 capitalize text-[10px] border-0 ${statusColor(displayOrg.status)}`}>{displayOrg.status}</Badge></div>
                </div>
                <Button size="sm" variant="outline" className="gap-2" onClick={() => { setEditForm({ organization_name: displayOrg.organization_name, org_code: displayOrg.org_code, contact_name: displayOrg.contact_name, contact_email: displayOrg.contact_email, status: displayOrg.status }); setEditOpen(true); }}>
                  <Edit className="w-4 h-4" />Edit Details
                </Button>
              </CardContent>
            </Card>

            {isAdmin && (
              <Card className="border-destructive/30">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">Deleting an organization is permanent and cannot be undone.</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" className="gap-2"><Trash2 className="w-4 h-4" />Delete Organization</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-card border-border/50">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {displayOrg.organization_name}?</AlertDialogTitle>
                        <AlertDialogDescription>This will permanently delete the organization and all associated data. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteOrg.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Organization Modal */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Edit Organization</DialogTitle></DialogHeader>
          {editForm && (
            <form onSubmit={(e) => { e.preventDefault(); updateOrg.mutate(editForm); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Name *</Label><Input value={editForm.organization_name} onChange={(e) => setEditForm((f: any) => ({ ...f, organization_name: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Org Code *</Label><Input value={editForm.org_code} onChange={(e) => setEditForm((f: any) => ({ ...f, org_code: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Name *</Label><Input value={editForm.contact_name} onChange={(e) => setEditForm((f: any) => ({ ...f, contact_name: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Contact Email *</Label><Input type="email" value={editForm.contact_email} onChange={(e) => setEditForm((f: any) => ({ ...f, contact_email: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Status</Label>
                <Select value={editForm.status} onValueChange={(v) => setEditForm((f: any) => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 bg-muted/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prospect">Prospect</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="churned">Churned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
                <Button type="submit" className="gold-glow-hover" disabled={updateOrg.isPending}>{updateOrg.isPending ? "Saving..." : "Save"}</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Team Member Modal */}
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Add Team Member</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); addTeamMember.mutate(memberForm); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Full Name *</Label><Input value={memberForm.full_name} onChange={(e) => setMemberForm(f => ({ ...f, full_name: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label><Input type="email" value={memberForm.email} onChange={(e) => setMemberForm(f => ({ ...f, email: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Department *</Label><Input value={memberForm.department} onChange={(e) => setMemberForm(f => ({ ...f, department: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
              <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Role *</Label><Input value={memberForm.role} onChange={(e) => setMemberForm(f => ({ ...f, role: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setAddMemberOpen(false)}>Cancel</Button>
              <Button type="submit" className="gold-glow-hover" disabled={addTeamMember.isPending}>{addTeamMember.isPending ? "Adding..." : "Add"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
