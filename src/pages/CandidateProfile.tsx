import DOMPurify from "dompurify";
import { useParams, Link, useNavigate } from "react-router-dom";
import { mockCandidates, STAGE_LABELS, type Candidate } from "@/data/mockData";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useCandidates, type DbCandidate } from "@/hooks/useCandidates";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, ClipboardCheck, FileText, CalendarDays,
  FileSignature, CheckSquare, Users, Activity, GraduationCap,
  Home, StickyNote, MapPin, Phone, Mail, ExternalLink, Trash2,
  Edit, Plus, Send, Link as LinkIcon, X, Video, Upload, Play,
  Shield, Zap
} from "lucide-react";
import { PreScreeningSection } from "@/components/candidate/PreScreeningSection";
import { BuddyMatchingSection } from "@/components/candidate/BuddyMatchingSection";
import { PlacementRiskAlert } from "@/components/candidate/PlacementRiskAlert";
import { JourneyTimeline } from "@/components/journey/JourneyTimeline";
import { JourneyProgressCard } from "@/components/journey/JourneyProgressCard";
import { useEngagementCheckins } from "@/hooks/useEngagementCheckins";
import { useChurnPrediction } from "@/hooks/useChurnPrediction";
import { VelocityCard } from "@/components/engagement/VelocityCard";
import { VelocityBadge } from "@/components/engagement/VelocityBadge";
import { ChurnPredictionCard } from "@/components/engagement/ChurnPredictionCard";
import { EngagementChart } from "@/components/engagement/EngagementChart";
import { MOOD_EMOJIS, MOOD_LABELS, CONFIDENCE_EMOJIS, CONFIDENCE_LABELS, TEAM_EMOJIS, TEAM_LABELS } from "@/utils/velocityScoring";
import { TeamCompatibilityPreview } from "@/components/candidate/TeamCompatibilityPreview";
import { ProfessionalView } from "@/components/candidate/ProfessionalView";
import { ResumeUploadSection } from "@/components/candidate/ResumeUploadSection";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const sidebarItems = [
  { id: "personal", label: "Personal Info", icon: User },
  { id: "journey", label: "Journey", icon: MapPin },
  { id: "video", label: "Video Profile", icon: Video },
  { id: "prescreening", label: "Pre-Screening", icon: ClipboardCheck },
  { id: "dossier", label: "Dossier", icon: FileText },
  { id: "interviews", label: "Interviews", icon: CalendarDays },
  { id: "offer", label: "Offer", icon: FileSignature },
  { id: "logistics", label: "Pre-Arrival", icon: CheckSquare },
  { id: "buddy", label: "Buddy", icon: Users },
  { id: "engagement", label: "Engagement", icon: Activity },
  { id: "academy", label: "Academy", icon: GraduationCap },
  { id: "housing", label: "Housing", icon: Home },
  { id: "notes", label: "Notes", icon: StickyNote },
];

function dbToCandidate(db: DbCandidate): Candidate {
  return {
    id: db.id,
    full_name: db.full_name,
    email: db.email,
    phone: db.phone ?? "",
    photo_url: db.photo_url ?? `https://api.dicebear.com/7.x/personas/svg?seed=${db.id}`,
    current_stage: db.current_stage as any,
    days_in_stage: db.days_in_stage,
    risk_level: db.risk_level as any,
    engagement_score: db.engagement_score,
    last_contact_date: db.last_contact_date ?? "",
    referral_source: db.referral_source ?? "",
    current_location: db.current_location ?? "",
    desired_location: db.desired_location ?? "",
    organization_id: db.organization_id ?? "",
    prescreening_complete: db.prescreening_complete,
  };
}

export default function CandidateProfile() {
  const { id } = useParams();
  const { isDemoMode } = useDemoMode();
  const { candidates: dbCandidates, deleteCandidate, updateCandidate } = useCandidates();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("personal");

  // Fetch prescreening data to get archetype
  const { data: prescreeningData } = useQuery({
    queryKey: ["prescreening_data", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescreening_data")
        .select("tribe_viral_archetype, tribe_viral_scores, dimension_scores")
        .eq("candidate_id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode && !!id,
  });

  const baseCandidate = isDemoMode
    ? mockCandidates.find((c) => c.id === id)
    : dbCandidates.map(dbToCandidate).find((c) => c.id === id);

  // Merge prescreening data: prefer dimension_scores (5 dimensions) over tribe_viral_scores (archetype weights)
  const candidate = baseCandidate && !isDemoMode && prescreeningData
    ? {
        ...baseCandidate,
        archetype: prescreeningData.tribe_viral_archetype as any,
        tribe_viral_scores: (prescreeningData.dimension_scores as any) ?? (prescreeningData.tribe_viral_scores as any),
      }
    : baseCandidate;

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Candidate not found</p>
          <Link to="/"><Button variant="outline">Back to Dashboard</Button></Link>
        </div>
      </div>
    );
  }

  const isAtRisk = candidate.risk_level === "high";

  const handleDelete = async () => {
    try {
      await deleteCandidate(candidate.id);
      navigate("/");
    } catch (e) {
      // toast handled by hook
    }
  };

  const handleUpdate = async (updates: Record<string, any>) => {
    try {
      await updateCandidate({ id: candidate.id, ...updates });
    } catch (e) {
      // toast handled by hook
    }
  };

  const orgName = isDemoMode ? "Ashford Manor Hotel" : undefined;

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Placement Risk Alert */}
      {candidate.archetype && candidate.prescreening_complete && (
        <PlacementRiskAlert
          candidateArchetype={candidate.archetype}
          candidateName={candidate.full_name}
          organizationName={orgName}
          organizationId={candidate.organization_id}
          targetDepartment="Front Office"
          isDemoMode={isDemoMode}
        />
      )}

      {isAtRisk && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/15 border border-destructive/30 rounded-xl p-4 mb-6 flex items-center gap-3">
          <span className="text-lg">🚨</span>
          <div>
            <p className="text-sm font-semibold text-destructive">GHOSTING RISK</p>
            <p className="text-xs text-muted-foreground">
              No contact for {Math.floor((Date.now() - new Date(candidate.last_contact_date).getTime()) / 86400000)} days — Engagement score: {candidate.engagement_score}%
            </p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto border-destructive/50 text-destructive hover:bg-destructive/10">Send Check-In</Button>
        </motion.div>
      )}

      <div className="flex items-center gap-4 mb-6">
        <Link to="/"><Button variant="ghost" size="sm" className="gap-2"><ArrowLeft className="w-4 h-4" /> Back</Button></Link>
      </div>

      <div className="flex gap-6">
        <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-card rounded-xl border border-border/50 p-3 sticky top-24">
            {sidebarItems.map((item) => (
              <button key={item.id} onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === item.id ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                <item.icon className="w-4 h-4" />{item.label}
              </button>
            ))}
            {isDemoMode && id === "c3" && (
              <button onClick={() => setActiveSection("professional")}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors mt-1 ${activeSection === "professional" ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"}`}>
                <span className="w-4 h-4 flex items-center justify-center text-xs">✨</span>
                <span className="flex-1 text-left">Professional View</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.2)", color: "#F59E0B" }}>Sends on acceptance</span>
              </button>
            )}
          </div>
        </motion.aside>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 min-w-0">
          {/* Profile header */}
          <div className="bg-card rounded-xl border border-border/50 p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-muted overflow-hidden border-2 border-border flex-shrink-0">
                <img src={candidate.photo_url} alt={candidate.full_name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold">
                    {candidate.full_name}
                    {candidate.role_title && <span className="text-muted-foreground font-normal"> • {candidate.role_title}</span>}
                  </h1>
                  <Badge variant={isAtRisk ? "destructive" : "secondary"}>{STAGE_LABELS[candidate.current_stage]}</Badge>
                  {candidate.archetype && <Badge variant="outline" className="capitalize">{candidate.archetype}</Badge>}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" />{candidate.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{candidate.phone}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{candidate.current_location}</span>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${isAtRisk ? "bg-destructive" : candidate.risk_level === "medium" ? "bg-warning" : "bg-success"}`} />
                    <span className="text-xs font-medium">Engagement: {candidate.engagement_score}%</span>
                  </div>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">{candidate.days_in_stage} days in stage</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="text-xs text-muted-foreground">Source: {candidate.referral_source}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Journey Progress Card (shown on all sections except journey itself) */}
          {!isDemoMode && activeSection !== "journey" && (
            <JourneyProgressCard candidateId={candidate.id} />
          )}

          {activeSection === "personal" && (
            <>
              <PersonalInfo candidate={candidate} isDemoMode={isDemoMode} onDelete={!isDemoMode ? handleDelete : undefined} onUpdate={!isDemoMode ? handleUpdate : undefined} />
              {!isDemoMode && <div className="mt-6"><ResumeUploadSection candidateId={candidate.id} /></div>}
            </>
          )}
          {activeSection === "journey" && !isDemoMode && <JourneyTimeline candidateId={candidate.id} organizationId={candidate.organization_id} candidateName={candidate.full_name} />}
          {activeSection === "journey" && isDemoMode && (
            <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
              <p className="text-muted-foreground text-sm">Journey Blueprint is available in live mode. Switch off demo mode to view real journey data.</p>
            </div>
          )}
          {activeSection === "video" && <VideoProfileSection candidateId={candidate.id} isDemoMode={isDemoMode} />}
          {activeSection === "prescreening" && <PreScreeningSection candidate={candidate} isDemoMode={isDemoMode} onUpdate={!isDemoMode ? handleUpdate : undefined} />}
          {activeSection === "dossier" && <DossierSection candidate={candidate} isDemoMode={isDemoMode} />}
          {activeSection === "interviews" && <InterviewSection candidateId={candidate.id} isDemoMode={isDemoMode} />}
          {activeSection === "offer" && <OfferSection candidateId={candidate.id} isDemoMode={isDemoMode} />}
          {activeSection === "logistics" && <LogisticsSection candidateId={candidate.id} isDemoMode={isDemoMode} />}
          {activeSection === "buddy" && <BuddyMatchingSection candidateId={candidate.id} candidateArchetype={candidate.archetype} organizationId={candidate.organization_id} isDemoMode={isDemoMode} />}
          {activeSection === "engagement" && <EngagementSectionNew candidateId={candidate.id} candidate={candidate} isDemoMode={isDemoMode} />}
          {activeSection === "academy" && <PlaceholderSection title="Academy Training Progress" emoji="📚" description="Academy integration coming soon." isPlaceholder />}
          {activeSection === "housing" && <PlaceholderSection title="Housing Accommodation" emoji="🏠" description="Housing integration coming soon." isPlaceholder />}
          {activeSection === "notes" && <NotesSection candidateId={candidate.id} isDemoMode={isDemoMode} />}
          {activeSection === "professional" && isDemoMode && id === "c3" && <ProfessionalView />}
        </motion.div>
      </div>
    </div>
  );
}

/* ===================== PERSONAL INFO ===================== */
function PersonalInfo({ candidate, onDelete, onUpdate, isDemoMode }: { candidate: Candidate; onDelete?: () => void; onUpdate?: (u: Record<string, any>) => void; isDemoMode: boolean }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: candidate.full_name, email: candidate.email, phone: candidate.phone,
    current_location: candidate.current_location, desired_location: candidate.desired_location, referral_source: candidate.referral_source,
  });

  const handleSave = () => {
    onUpdate?.(form);
    setEditing(false);
  };

  const fields = [
    { label: "Full Name", key: "full_name" }, { label: "Email", key: "email" }, { label: "Phone", key: "phone" },
    { label: "Current Location", key: "current_location" }, { label: "Desired Location", key: "desired_location" }, { label: "Referral Source", key: "referral_source" },
  ] as const;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Personal Information</h2>
        {!isDemoMode && !editing && (
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => setEditing(true)}><Edit className="w-3.5 h-3.5" />Edit</Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.label}>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
            {editing ? (
              <Input value={form[field.key]} onChange={(e) => setForm(f => ({ ...f, [field.key]: e.target.value }))} className="mt-1 bg-muted/50" />
            ) : (
              <p className="mt-1 text-sm font-medium">{(candidate as any)[field.key] || "—"}</p>
            )}
          </div>
        ))}
      </div>
      {!isDemoMode && (
        <div className="flex gap-3 mt-6 pt-6 border-t border-border/50">
          {editing ? (
            <>
              <Button size="sm" className="gold-glow-hover" onClick={handleSave}>Save Changes</Button>
              <Button size="sm" variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
            </>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10 gap-2"><Trash2 className="w-3.5 h-3.5" />Delete Candidate</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border/50">
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {candidate.full_name}?</AlertDialogTitle>
                  <AlertDialogDescription>This action cannot be undone. All data for this candidate will be permanently removed.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      )}
    </div>
  );
}

/* ===================== VIDEO PROFILE ===================== */
interface VideoClip {
  id: string;
  title: string;
  url: string;
  uploaded_at: string;
}

function getEmbedUrl(url: string): string | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  // Direct video URL
  if (url.match(/\.(mp4|webm|ogg)(\?|$)/i)) return url;
  return null;
}

function VideoProfileSection({ candidateId, isDemoMode }: { candidateId: string; isDemoMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: candidateData } = useQuery({
    queryKey: ["candidate_video", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase.from("candidates").select("video_clips").eq("id", candidateId).single();
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const clips: VideoClip[] = isDemoMode
    ? [
        { id: "demo1", title: "Introduction", url: "demo-placeholder", uploaded_at: "2026-02-10T10:00:00Z" },
        { id: "demo2", title: "Why Hospitality?", url: "demo-placeholder", uploaded_at: "2026-02-09T14:00:00Z" },
        { id: "demo3", title: "Skills Demo — Plating", url: "demo-placeholder", uploaded_at: "2026-02-08T09:00:00Z" },
      ]
    : ((candidateData?.video_clips as unknown as VideoClip[]) || []);

  const saveMutation = useMutation({
    mutationFn: async (newClips: VideoClip[]) => {
      const { error } = await supabase.from("candidates").update({ video_clips: newClips as any }).eq("id", candidateId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["candidate_video", candidateId] }),
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleAddClip = () => {
    if (!title.trim() || !videoUrl.trim()) return;
    const newClip: VideoClip = {
      id: crypto.randomUUID(),
      title: title.trim(),
      url: videoUrl.trim(),
      uploaded_at: new Date().toISOString(),
    };
    saveMutation.mutate([...clips, newClip]);
    setTitle("");
    setVideoUrl("");
    setOpen(false);
    toast({ title: "Video clip added" });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum 50MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${candidateId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("candidate-videos").upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = await supabase.storage.from("candidate-videos").createSignedUrl(path, 60 * 60 * 24 * 365);
      if (urlData?.signedUrl) setVideoUrl(urlData.signedUrl);
      toast({ title: "Video uploaded", description: "URL populated. Click Save to add the clip." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (clipId: string) => {
    saveMutation.mutate(clips.filter(c => c.id !== clipId));
    toast({ title: "Video clip removed" });
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold">Video Profile</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Candidates aren't just résumés — they're video profiles.</p>
        </div>
        {!isDemoMode && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 gold-glow-hover"><Plus className="w-4 h-4" />Add Video Clip</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-lg">
              <DialogHeader><DialogTitle>Add Video Clip</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title *</Label>
                  <Select value={title} onValueChange={setTitle}>
                    <SelectTrigger className="mt-1 bg-muted/50"><SelectValue placeholder="Select or type a title" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Introduction">Introduction</SelectItem>
                      <SelectItem value="Why Hospitality?">Why Hospitality?</SelectItem>
                      <SelectItem value="Career Goals">Career Goals</SelectItem>
                      <SelectItem value="Skills Demo">Skills Demo</SelectItem>
                      <SelectItem value="Team Fit">Team Fit</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Or type a custom title..." className="mt-2 bg-muted/50" />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Video URL</Label>
                  <Input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="YouTube, Vimeo, or direct video URL" className="mt-1 bg-muted/50" />
                </div>
                <div className="relative">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Or Upload Video</Label>
                  <label className="mt-1 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/30 transition-colors">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Click to upload (max 50MB)"}</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                  </label>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button className="gold-glow-hover" onClick={handleAddClip} disabled={!title.trim() || !videoUrl.trim() || saveMutation.isPending}>
                    {saveMutation.isPending ? "Saving..." : "Save Clip"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {clips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clips.map((clip) => {
            const embedUrl = getEmbedUrl(clip.url);
            const isDirect = clip.url.match(/\.(mp4|webm|ogg)(\?|$)/i);
            return (
              <motion.div key={clip.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-border/50 overflow-hidden bg-muted/20">
                <div className="aspect-video relative" style={{ background: '#0f1729' }}>
                  {clip.url === "demo-placeholder" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <Video className="w-10 h-10 text-white/40" />
                      <p className="text-sm font-semibold text-white/70">Video Profile — Candidate Submission</p>
                      <p className="text-xs text-white/40">Demo mode — actual candidate videos visible to Charter Partners only</p>
                    </div>
                  ) : isDirect ? (
                    <video src={embedUrl || clip.url} controls className="w-full h-full object-contain" />
                  ) : embedUrl ? (
                    <iframe src={embedUrl} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <a href={clip.url} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                        <Play className="w-10 h-10" />
                        <span className="text-xs">Open Video</span>
                      </a>
                    </div>
                  )}
                </div>
                <div className="p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{clip.title}</p>
                    <p className="text-xs text-muted-foreground">{new Date(clip.uploaded_at).toLocaleDateString()}</p>
                  </div>
                  {!isDemoMode && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(clip.id)}>
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-4xl mb-3">🎬</span>
          <p className="text-sm text-muted-foreground text-center max-w-md">Add video clips to create a rich candidate profile. Hiring managers watch them before interviews.</p>
        </div>
      )}
    </div>
  );
}

/* PreScreening section moved to src/components/candidate/PreScreeningSection.tsx */

/* ===================== DOSSIER SECTION ===================== */
function DossierSection({ candidate, isDemoMode }: { candidate: Candidate; isDemoMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [sendOpen, setSendOpen] = useState(false);
  const [sendingDossierId, setSendingDossierId] = useState<string | null>(null);
  const [managerNotes, setManagerNotes] = useState("");
  const [selectedManager, setSelectedManager] = useState("");
  const [includeResume, setIncludeResume] = useState(true);
  const [generatedResult, setGeneratedResult] = useState<{ pin: string; code: string; url: string } | null>(null);

  // Send form state
  const [selectedSendManager, setSelectedSendManager] = useState<string>("");
  const [hmName, setHmName] = useState("");
  const [hmEmail, setHmEmail] = useState("");
  const [hmPhone, setHmPhone] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");
  const [sendIncludeResume, setSendIncludeResume] = useState(true);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if candidate has a resume uploaded
  const { data: resumeInfo } = useQuery({
    queryKey: ["candidate-resume-check", candidate.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("resume_url, resume_filename")
        .eq("id", candidate.id)
        .single();
      if (error) throw error;
      return data as { resume_url: string | null; resume_filename: string | null };
    },
    enabled: !isDemoMode,
  });

  const hasResume = !!resumeInfo?.resume_url;

  const { data: managers = [] } = useQuery({
    queryKey: ["hiring_managers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hiring_managers").select("*").order("full_name");
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const { data: dossiers = [] } = useQuery({
    queryKey: ["dossiers", candidate.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("dossiers").select("*, hiring_managers(full_name, department)").eq("candidate_id", candidate.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const createDossier = useMutation({
    mutationFn: async () => {
      const pin = Math.random().toString().slice(2, 8);
      const code = Math.random().toString(36).slice(2, 10);

      const dossierPayload: any = {
        candidate_id: candidate.id,
        unique_code: code,
        pin_code: pin,
        hiring_manager_id: selectedManager || null,
        manager_notes: managerNotes || null,
        status: "not_sent",
        include_resume: includeResume && hasResume,
      };

      if (includeResume && hasResume && resumeInfo?.resume_url) {
        const { data: signedData } = await supabase.storage
          .from("candidate-resumes")
          .createSignedUrl(resumeInfo.resume_url, 30 * 24 * 60 * 60);
        if (signedData?.signedUrl) {
          dossierPayload.resume_url = signedData.signedUrl;
          dossierPayload.resume_filename = resumeInfo.resume_filename;
        }
      }

      const { error } = await supabase.from("dossiers").insert(dossierPayload);
      if (error) throw error;
      return { pin, code, url: `${window.location.origin}/dossier/${code}` };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dossiers", candidate.id] });
      setGeneratedResult(result);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendDossierMutation = useMutation({
    mutationFn: async (dossierId: string) => {
      const dossier = dossiers.find((d: any) => d.id === dossierId);
      if (!dossier) throw new Error("Dossier not found");

      // Generate signed resume URL if including resume
      let resumeUrl = dossier.resume_url;
      if (sendIncludeResume && hasResume && resumeInfo?.resume_url && !resumeUrl) {
        const { data: signedData } = await supabase.storage
          .from("candidate-resumes")
          .createSignedUrl(resumeInfo.resume_url, 30 * 24 * 60 * 60);
        resumeUrl = signedData?.signedUrl ?? null;
      }

      // Update dossier with manager details and mark as sent
      const { error: updateError } = await supabase
        .from("dossiers")
        .update({
          status: "sent",
          sent_at: new Date().toISOString(),
          hiring_manager_name: hmName,
          hiring_manager_email: hmEmail,
          hiring_manager_phone: hmPhone || null,
          personal_message: personalMessage || null,
          include_resume: sendIncludeResume && hasResume,
          resume_url: sendIncludeResume && hasResume ? resumeUrl : null,
          resume_filename: sendIncludeResume && hasResume ? (resumeInfo?.resume_filename ?? null) : null,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        } as any)
        .eq("id", dossierId);

      if (updateError) throw updateError;

      // Send email via edge function
      const dossierUrl = `${window.location.origin}/dossier/${dossier.unique_code}`;
      const { error: emailError } = await supabase.functions.invoke("send-dossier-email", {
        body: {
          to_email: hmEmail,
          to_name: hmName,
          candidate_name: candidate.full_name,
          candidate_archetype: (candidate as any).archetype ?? null,
          dossier_url: dossierUrl,
          pin_code: dossier.pin_code,
          personal_message: personalMessage || null,
          sender_name: null, // Could be current user name
          organization_name: null,
          includes_resume: sendIncludeResume && hasResume,
        },
      });

      if (emailError) throw emailError;

      // Log to audit
      await supabase.from("audit_log").insert({
        event_type: "dossier_sent",
        payload: {
          candidate_id: candidate.id,
          hiring_manager_email: hmEmail,
          dossier_code: dossier.unique_code,
        },
      } as any);

      return { managerName: hmName, managerEmail: hmEmail };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["dossiers", candidate.id] });
      toast({ title: "Dossier Sent!", description: `Sent to ${result.managerName} at ${result.managerEmail}` });
      handleSendDialogClose(false);
    },
    onError: (e: any) => toast({ title: "Send Failed", description: e.message, variant: "destructive" }),
  });

  const handleGenerate = () => createDossier.mutate();

  const handleDialogClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setGeneratedResult(null);
      setManagerNotes("");
      setSelectedManager("");
      setIncludeResume(true);
    }
  };

  const handleSendDialogClose = (isOpen: boolean) => {
    setSendOpen(isOpen);
    if (!isOpen) {
      setSendingDossierId(null);
      setHmName("");
      setHmEmail("");
      setHmPhone("");
      setPersonalMessage("");
      setSendIncludeResume(true);
    }
  };

  const openSendDialog = (dossierId: string, d: any) => {
    setSendingDossierId(dossierId);
    // Pre-fill from hiring_managers if linked
    if (d.hiring_managers) {
      setHmName(d.hiring_managers.full_name || "");
    }
    if (d.hiring_manager_email) {
      setHmEmail(d.hiring_manager_email);
    }
    if (d.hiring_manager_name) {
      setHmName(d.hiring_manager_name);
    }
    setSendOpen(true);
  };

  const resendDossier = (dossierId: string) => {
    const d = dossiers.find((x: any) => x.id === dossierId);
    if (d) {
      setHmName(d.hiring_manager_name || d.hiring_managers?.full_name || "");
      setHmEmail(d.hiring_manager_email || "");
      setHmPhone(d.hiring_manager_phone || "");
      setSendingDossierId(dossierId);
      setSendOpen(true);
    }
  };

  const statusColors: Record<string, string> = {
    not_sent: "bg-muted text-muted-foreground",
    sent: "bg-primary/20 text-primary",
    viewed: "bg-accent text-accent-foreground",
    interested: "bg-success/20 text-success",
    passed: "bg-destructive/20 text-destructive",
    need_more_info: "bg-warning/20 text-warning",
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Dossier & Submission</h2>
        {!isDemoMode && (
          <Dialog open={open} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 gold-glow-hover" disabled={!candidate.prescreening_complete}>
                <FileText className="w-4 h-4" />Generate Dossier
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-lg">
              <DialogHeader><DialogTitle>{generatedResult ? "Dossier Generated!" : "Generate Dossier"}</DialogTitle></DialogHeader>
              {generatedResult ? (
                <div className="space-y-4">
                  <div className="bg-success/10 border border-success/30 rounded-lg p-4 text-center">
                    <p className="text-sm font-semibold text-success mb-1">✓ Dossier Created Successfully</p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">PIN Code</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={generatedResult.pin} readOnly className="bg-muted/50 font-mono text-lg text-center font-bold tracking-widest" />
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedResult.pin); toast({ title: "PIN copied!" }); }}><LinkIcon className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Dossier URL</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Input value={generatedResult.url} readOnly className="bg-muted/50 font-mono text-xs" />
                      <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(generatedResult.url); toast({ title: "URL copied!" }); }}><LinkIcon className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button variant="outline" onClick={() => handleDialogClose(false)}>Done</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Hiring Manager</Label>
                    <Select value={selectedManager} onValueChange={setSelectedManager}>
                      <SelectTrigger className="mt-1 bg-muted/50"><SelectValue placeholder="Select hiring manager" /></SelectTrigger>
                      <SelectContent>
                        {managers.length > 0 ? managers.map((m: any) => (
                          <SelectItem key={m.id} value={m.id}>{m.full_name} — {m.department}</SelectItem>
                        )) : (
                          <SelectItem value="none" disabled>No managers configured yet</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes for Hiring Manager</Label>
                    <Textarea value={managerNotes} onChange={(e) => setManagerNotes(e.target.value)} placeholder="Add context for the hiring manager..." className="mt-1 bg-muted/50" />
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Checkbox id="include-resume" checked={includeResume && hasResume} onCheckedChange={(checked) => setIncludeResume(!!checked)} disabled={!hasResume} />
                    <label htmlFor="include-resume" className="text-sm flex-1 cursor-pointer">
                      {hasResume ? (<>Include candidate's CV/Resume <span className="text-muted-foreground">({resumeInfo?.resume_filename})</span></>) : (<span className="text-muted-foreground">No CV/Resume uploaded for this candidate</span>)}
                    </label>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">A 6-digit PIN code and unique dossier link will be auto-generated.</p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
                    <Button className="gold-glow-hover" onClick={handleGenerate} disabled={createDossier.isPending}>
                      {createDossier.isPending ? "Generating..." : "Generate Dossier"}
                    </Button>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Send Dossier Dialog */}
      <Dialog open={sendOpen} onOpenChange={handleSendDialogClose}>
        <DialogContent className="bg-card border-border/50 max-w-lg">
          <DialogHeader><DialogTitle>Send Dossier to Hiring Manager</DialogTitle></DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); if (sendingDossierId) sendDossierMutation.mutate(sendingDossierId); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Manager Name *</Label>
                <Input value={hmName} onChange={(e) => setHmName(e.target.value)} required className="mt-1 bg-muted/50" placeholder="John Smith" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email *</Label>
                <Input type="email" value={hmEmail} onChange={(e) => setHmEmail(e.target.value)} required className="mt-1 bg-muted/50" placeholder="john@hotel.com" />
              </div>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Phone (optional)</Label>
              <Input type="tel" value={hmPhone} onChange={(e) => setHmPhone(e.target.value)} className="mt-1 bg-muted/50" placeholder="+353..." />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Personal Message (optional)</Label>
              <Textarea value={personalMessage} onChange={(e) => setPersonalMessage(e.target.value)} placeholder="Add a personal note to the hiring manager..." className="mt-1 bg-muted/50" rows={3} />
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
              <Checkbox id="send-include-resume" checked={sendIncludeResume && hasResume} onCheckedChange={(checked) => setSendIncludeResume(!!checked)} disabled={!hasResume} />
              <label htmlFor="send-include-resume" className="text-sm flex-1 cursor-pointer">
                {hasResume ? (<>Include CV/Resume <span className="text-muted-foreground">({resumeInfo?.resume_filename})</span></>) : (<span className="text-muted-foreground">No CV/Resume uploaded</span>)}
              </label>
            </div>
            <div className="bg-muted/30 rounded-lg p-3">
              <p className="text-xs font-medium text-foreground mb-1">Dossier will include:</p>
              <ul className="text-xs text-muted-foreground space-y-0.5">
                <li>• Candidate DNA profile & archetype</li>
                <li>• Skills & dimension scores</li>
                <li>• Sector/Geography/Department fit</li>
                {sendIncludeResume && hasResume && <li>• CV/Resume</li>}
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => handleSendDialogClose(false)}>Cancel</Button>
              <Button type="submit" className="gap-2 gold-glow-hover" disabled={sendDossierMutation.isPending}>
                <Send className="w-3.5 h-3.5" />
                {sendDossierMutation.isPending ? "Sending..." : "Send Dossier"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {!candidate.prescreening_complete && (
        <p className="text-sm text-muted-foreground mb-4">Pre-screening must be completed before generating a dossier.</p>
      )}
      {!isDemoMode && dossiers.length > 0 ? (
        <div className="space-y-3">
          {dossiers.map((d: any) => (
            <div key={d.id} className="p-3 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">
                    Dossier — {d.hiring_manager_name || d.hiring_managers?.full_name || "No manager"}
                    {d.hiring_managers?.department ? ` (${d.hiring_managers.department})` : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Created {new Date(d.created_at).toLocaleDateString()} · PIN: {d.pin_code} · Views: {d.view_count}
                  </p>
                  {d.hiring_manager_email && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3" /> {d.hiring_manager_email}
                      {d.sent_at && ` · Sent ${new Date(d.sent_at).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {d.status === "not_sent" && (
                    <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => openSendDialog(d.id, d)}>
                      <Send className="w-3 h-3" /> Send
                    </Button>
                  )}
                  {(d.status === "sent" || d.status === "viewed") && (
                    <Button size="sm" variant="ghost" className="gap-1.5 text-xs" onClick={() => resendDossier(d.id)}>
                      <Send className="w-3 h-3" /> Resend
                    </Button>
                  )}
                  <Badge className={`capitalize text-[10px] border-0 ${statusColors[d.status] ?? statusColors.not_sent}`}>
                    {d.status?.replace("_", " ")}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          {candidate.archetype && (
            <TeamCompatibilityPreview candidateArchetype={candidate.archetype} candidateName={candidate.full_name} />
          )}
        </div>
      ) : (
        !isDemoMode && candidate.prescreening_complete && (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-4xl mb-3">📄</span>
            <p className="text-sm text-muted-foreground text-center max-w-md">Generate and track PIN-protected dossiers for hiring managers.</p>
          </div>
        )
      )}
      {isDemoMode && (
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center py-12">
            <span className="text-4xl mb-3">📄</span>
            <p className="text-sm text-muted-foreground text-center max-w-md">Generate and track PIN-protected dossiers for hiring managers.</p>
          </div>
          {candidate.archetype && (
            <TeamCompatibilityPreview candidateArchetype={candidate.archetype} candidateName={candidate.full_name} />
          )}
        </div>
      )}
    </div>
  );
}
function InterviewSection({ candidateId, isDemoMode }: { candidateId: string; isDemoMode: boolean }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ interviewer_name: "", scheduled_date: "", interview_type: "video" as string, location_or_link: "", notes: "" });

  const { data: interviews = [] } = useQuery({
    queryKey: ["interviews", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase.from("interviews").select("*").eq("candidate_id", candidateId).order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const createInterview = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("interviews").insert({ candidate_id: candidateId, ...form } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["interviews", candidateId] });
      toast({ title: "Interview added" });
      setOpen(false);
      setForm({ interviewer_name: "", scheduled_date: "", interview_type: "video", location_or_link: "", notes: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Interview Tracker</h2>
        {!isDemoMode && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 gold-glow-hover"><Plus className="w-4 h-4" />Add Interview</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-lg">
              <DialogHeader><DialogTitle>Schedule Interview</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createInterview.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Interviewer *</Label><Input value={form.interviewer_name} onChange={(e) => setForm(f => ({ ...f, interviewer_name: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Date & Time *</Label><Input type="datetime-local" value={form.scheduled_date} onChange={(e) => setForm(f => ({ ...f, scheduled_date: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
                    <Select value={form.interview_type} onValueChange={(v) => setForm(f => ({ ...f, interview_type: v }))}>
                      <SelectTrigger className="mt-1 bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="phone">Phone</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="in_person">In Person</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Location / Link</Label><Input value={form.location_or_link} onChange={(e) => setForm(f => ({ ...f, location_or_link: e.target.value }))} className="mt-1 bg-muted/50" /></div>
                </div>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Notes</Label><Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="mt-1 bg-muted/50" /></div>
                <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="gold-glow-hover" disabled={createInterview.isPending}>{createInterview.isPending ? "Adding..." : "Add Interview"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
      {!isDemoMode && interviews.length > 0 ? (
        <div className="space-y-3">
          {interviews.map((iv: any) => (
            <div key={iv.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium">Round {iv.round_number} — {iv.interviewer_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(iv.scheduled_date).toLocaleString()} · {iv.interview_type}</p>
              </div>
              <Badge variant="secondary" className="capitalize text-[10px]">{iv.status}</Badge>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-4xl mb-3">📅</span>
          <p className="text-sm text-muted-foreground text-center max-w-md">Schedule and track interview rounds, outcomes, and notes.</p>
        </div>
      )}
    </div>
  );
}

/* ===================== OFFER SECTION ===================== */
function OfferSection({ candidateId, isDemoMode }: { candidateId: string; isDemoMode: boolean }) {
  const [open, setOpen] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [letterHtml, setLetterHtml] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ job_title: "", salary: "", start_date: "", contract_type: "full_time", department: "", benefits_summary: "" });

  const { data: offers = [] } = useQuery({
    queryKey: ["offers", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase.from("offers").select("*").eq("candidate_id", candidateId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const createOffer = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("offers").insert({
        candidate_id: candidateId, job_title: form.job_title,
        salary: form.salary ? Number(form.salary) : null,
        start_date: form.start_date || null, contract_type: form.contract_type,
        department: form.department || null, benefits_summary: form.benefits_summary || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", candidateId] });
      toast({ title: "Offer created" });
      setOpen(false);
      setForm({ job_title: "", salary: "", start_date: "", contract_type: "full_time", department: "", benefits_summary: "" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const offerStatusColors: Record<string, string> = {
    pending: "bg-warning/20 text-warning",
    signed: "bg-success/20 text-success",
    declined: "bg-destructive/20 text-destructive",
    expired: "bg-muted text-muted-foreground",
  };

  const generateOfferLetter = (offer: any) => {
    const html = `
      <div style="font-family: Georgia, serif; max-width: 700px; margin: 0 auto; padding: 40px;">
        <div style="border-bottom: 3px solid #c9a227; padding-bottom: 20px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 24px; color: #1a1a1a;">Be Connect</h1>
          <p style="margin: 4px 0 0; color: #666; font-size: 12px;">Global Hospitality Talent Solutions</p>
        </div>
        <p style="color: #333;">Date: ${new Date().toLocaleDateString()}</p>
        <h2 style="color: #1a1a1a; margin-top: 30px;">Offer of Employment</h2>
        <p style="color: #333; line-height: 1.6;">We are pleased to offer you the position of <strong>${offer.job_title}</strong>${offer.department ? ` in the <strong>${offer.department}</strong> department` : ''}.</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Position</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${offer.job_title}</td></tr>
          ${offer.salary ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Annual Salary</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">$${Number(offer.salary).toLocaleString()}</td></tr>` : ''}
          ${offer.start_date ? `<tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Start Date</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${new Date(offer.start_date).toLocaleDateString()}</td></tr>` : ''}
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Contract Type</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; text-transform: capitalize;">${offer.contract_type?.replace('_', ' ')}</td></tr>
        </table>
        ${offer.benefits_summary ? `<h3 style="color: #1a1a1a;">Benefits</h3><p style="color: #333; line-height: 1.6;">${offer.benefits_summary}</p>` : ''}
        <div style="margin-top: 40px; padding: 20px; background: #f8f8f8; border-radius: 8px; text-align: center;">
          <button style="background: #c9a227; color: white; border: none; padding: 12px 32px; font-size: 16px; border-radius: 6px; cursor: pointer;">Accept Offer</button>
        </div>
        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 11px;">
          <p>This offer is contingent upon successful completion of all pre-employment requirements.</p>
        </div>
      </div>
    `;
    setLetterHtml(html);
    setLetterOpen(true);
  };

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Offer Management</h2>
        {!isDemoMode && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2 gold-glow-hover"><Plus className="w-4 h-4" />Create Offer</Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border/50 max-w-lg">
              <DialogHeader><DialogTitle>Create Offer</DialogTitle></DialogHeader>
              <form onSubmit={(e) => { e.preventDefault(); createOffer.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Job Title *</Label><Input value={form.job_title} onChange={(e) => setForm(f => ({ ...f, job_title: e.target.value }))} required className="mt-1 bg-muted/50" /></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Salary</Label><Input type="number" value={form.salary} onChange={(e) => setForm(f => ({ ...f, salary: e.target.value }))} className="mt-1 bg-muted/50" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Start Date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))} className="mt-1 bg-muted/50" /></div>
                  <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Contract Type</Label>
                    <Select value={form.contract_type} onValueChange={(v) => setForm(f => ({ ...f, contract_type: v }))}>
                      <SelectTrigger className="mt-1 bg-muted/50"><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="full_time">Full Time</SelectItem><SelectItem value="part_time">Part Time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="seasonal">Seasonal</SelectItem></SelectContent>
                    </Select>
                  </div>
                </div>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Department</Label><Input value={form.department} onChange={(e) => setForm(f => ({ ...f, department: e.target.value }))} className="mt-1 bg-muted/50" /></div>
                <div><Label className="text-xs uppercase tracking-wider text-muted-foreground">Benefits Summary</Label><Textarea value={form.benefits_summary} onChange={(e) => setForm(f => ({ ...f, benefits_summary: e.target.value }))} placeholder="Health insurance, relocation package, etc." className="mt-1 bg-muted/50" /></div>
                <div className="flex justify-end gap-3"><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="gold-glow-hover" disabled={createOffer.isPending}>{createOffer.isPending ? "Creating..." : "Create Offer"}</Button></div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Offer Letter Preview Dialog */}
      <Dialog open={letterOpen} onOpenChange={setLetterOpen}>
        <DialogContent className="bg-card border-border/50 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Offer Letter Preview</DialogTitle></DialogHeader>
          <div className="border rounded-lg bg-background p-2" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(letterHtml) }} />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setLetterOpen(false)}>Close</Button>
            <Button variant="outline" className="gap-2" onClick={() => {
              const blob = new Blob([letterHtml], { type: "text/html" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url; a.download = "offer-letter.html"; a.click();
              URL.revokeObjectURL(url);
              toast({ title: "Offer letter downloaded" });
            }}><FileText className="w-3.5 h-3.5" />Download HTML</Button>
          </div>
        </DialogContent>
      </Dialog>

      {!isDemoMode && offers.length > 0 ? (
        <div className="space-y-3">
          {offers.map((offer: any) => (
            <div key={offer.id} className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium">{offer.job_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {offer.salary ? `$${Number(offer.salary).toLocaleString()}` : "No salary"} · {offer.contract_type?.replace("_", " ")}
                    {offer.start_date ? ` · Start: ${new Date(offer.start_date).toLocaleDateString()}` : ""}
                  </p>
                </div>
                <Badge className={`capitalize text-[10px] border-0 ${offerStatusColors[offer.status] ?? offerStatusColors.pending}`}>
                  {offer.status}
                </Badge>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => generateOfferLetter(offer)}>
                  <FileText className="w-3 h-3" />Generate Letter
                </Button>
                <Button size="sm" variant="outline" className="gap-1 text-xs h-7" onClick={() => toast({ title: "Email sent", description: "Offer letter link has been sent to the candidate." })}>
                  <Send className="w-3 h-3" />Send to Candidate
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <span className="text-4xl mb-3">✍️</span>
          <p className="text-sm text-muted-foreground text-center max-w-md">Create offers, track negotiations, and collect e-signatures.</p>
        </div>
      )}
    </div>
  );
}

/* ===================== LOGISTICS SECTION ===================== */
function LogisticsSection({ candidateId, isDemoMode }: { candidateId: string; isDemoMode: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newItem, setNewItem] = useState("");

  const { data: dbItems = [] } = useQuery({
    queryKey: ["logistics", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase.from("logistics_checklist").select("*").eq("candidate_id", candidateId).order("order_position");
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  // Fetch offer start_date for due date calculation
  const { data: offers = [] } = useQuery({
    queryKey: ["offers_for_logistics", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase.from("offers").select("start_date").eq("candidate_id", candidateId).order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const mockItems = [
    { id: "m1", item_name: "Visa Status", status: "in_progress", is_enabled: true, due_date: null },
    { id: "m2", item_name: "Police Check", status: "complete", is_enabled: true, due_date: null },
    { id: "m3", item_name: "Flight Booking", status: "pending", is_enabled: true, due_date: null },
    { id: "m4", item_name: "Housing Secured", status: "pending", is_enabled: true, due_date: null },
    { id: "m5", item_name: "Academy Training", status: "pending", is_enabled: false, due_date: null },
    { id: "m6", item_name: "Pre-Arrival Call", status: "pending", is_enabled: true, due_date: null },
  ];

  const items = isDemoMode ? mockItems : dbItems;

  const addItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("logistics_checklist").insert({ candidate_id: candidateId, item_name: newItem, order_position: items.length } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistics", candidateId] });
      setNewItem("");
      toast({ title: "Item added" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: string }) => {
      const newStatus = currentStatus === "complete" ? "pending" : "complete";
      const { error } = await supabase.from("logistics_checklist").update({ status: newStatus, completed_at: newStatus === "complete" ? new Date().toISOString() : null } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["logistics", candidateId] }),
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("logistics_checklist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistics", candidateId] });
      toast({ title: "Item removed" });
    },
  });

  const autoPopulate = useMutation({
    mutationFn: async () => {
      const startDate = offers[0]?.start_date ? new Date(offers[0].start_date) : null;
      const standardItems = [
        { name: "Visa Application", daysBefore: 60 },
        { name: "Police Check", daysBefore: 45 },
        { name: "Flight Booking", daysBefore: 21 },
        { name: "Housing Secured", daysBefore: 14 },
        { name: "Academy Complete", daysBefore: 7 },
      ];
      const inserts = standardItems.map((item, i) => {
        let dueDate: string | null = null;
        if (startDate) {
          const d = new Date(startDate);
          d.setDate(d.getDate() - item.daysBefore);
          dueDate = d.toISOString().split("T")[0];
        }
        return {
          candidate_id: candidateId,
          item_name: item.name,
          order_position: i,
          due_date: dueDate,
        };
      });
      const { error } = await supabase.from("logistics_checklist").insert(inserts as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["logistics", candidateId] });
      toast({ title: "Checklist populated", description: "Standard pre-arrival items have been added." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const enabledItems = items.filter((i: any) => i.is_enabled);
  const completed = enabledItems.filter((i: any) => i.status === "complete").length;
  const total = enabledItems.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Pre-Arrival Logistics</h2>
        {!isDemoMode && items.length === 0 && (
          <Button size="sm" variant="outline" className="gap-2" onClick={() => autoPopulate.mutate()} disabled={autoPopulate.isPending}>
            <Plus className="w-4 h-4" />{autoPopulate.isPending ? "Populating..." : "Auto-Populate Standard Items"}
          </Button>
        )}
      </div>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{completed} of {total} items complete</span>
          <span className="font-semibold text-primary">{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} className="h-full bg-primary rounded-full" />
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item: any) => (
          <div key={item.id} className={`flex items-center justify-between p-3 rounded-lg ${item.is_enabled ? "bg-muted/30" : "bg-muted/10 opacity-50"}`}>
            <div className="flex items-center gap-3">
              {!isDemoMode ? (
                <Checkbox checked={item.status === "complete"} onCheckedChange={() => toggleItem.mutate({ id: item.id, currentStatus: item.status })} />
              ) : (
                <div className={`w-2.5 h-2.5 rounded-full ${item.status === "complete" ? "bg-success" : item.status === "in_progress" ? "bg-primary" : "bg-muted-foreground/30"}`} />
              )}
              <div>
                <span className="text-sm font-medium">{item.item_name}</span>
                {item.due_date && <p className="text-xs text-muted-foreground">Due: {new Date(item.due_date).toLocaleDateString()}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize text-[10px]">{item.status?.replace("_", " ")}</Badge>
              {!isDemoMode && (
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive" onClick={() => removeItem.mutate(item.id)}><X className="w-3.5 h-3.5" /></Button>
              )}
            </div>
          </div>
        ))}
      </div>
      {!isDemoMode && (
        <div className="flex gap-2 mt-4">
          <Input placeholder="New checklist item..." value={newItem} onChange={(e) => setNewItem(e.target.value)} className="bg-muted/50"
            onKeyDown={(e) => { if (e.key === "Enter" && newItem.trim()) { e.preventDefault(); addItem.mutate(); } }} />
          <Button size="sm" variant="outline" disabled={!newItem.trim() || addItem.isPending} onClick={() => addItem.mutate()}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ===================== NOTES SECTION ===================== */
function NotesSection({ candidateId, isDemoMode }: { candidateId: string; isDemoMode: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [noteText, setNoteText] = useState("");
  const [category, setCategory] = useState("general");

  const { data: notes = [] } = useQuery({
    queryKey: ["notes", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase.from("notes").select("*").eq("candidate_id", candidateId).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const createNote = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("notes").insert({ candidate_id: candidateId, note_text: noteText, category, author: "Current User" } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", candidateId] });
      toast({ title: "Note added" });
      setNoteText("");
      setCategory("general");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const categoryColors: Record<string, string> = {
    follow_up: "bg-primary/20 text-primary",
    concern: "bg-destructive/20 text-destructive",
    celebration: "bg-success/20 text-success",
    general: "bg-muted text-muted-foreground",
    legal: "bg-warning/20 text-warning",
    hr: "bg-accent text-accent-foreground",
  };

  const mockNotes = [
    { id: "n1", note_text: "Candidate confirmed availability for Q2 start date.", category: "follow_up", author: "Demo User", created_at: "2026-02-10T10:00:00Z" },
    { id: "n2", note_text: "Excellent references from previous employer.", category: "celebration", author: "Demo User", created_at: "2026-02-08T14:30:00Z" },
    { id: "n3", note_text: "Needs visa sponsorship — check requirements.", category: "concern", author: "Demo User", created_at: "2026-02-05T09:15:00Z" },
  ];

  const displayNotes = isDemoMode ? mockNotes : notes;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold mb-4">Notes & Timeline</h2>
      {!isDemoMode && (
        <div className="mb-6 p-4 rounded-lg bg-muted/30 space-y-3">
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." className="bg-background" />
          <div className="flex items-center gap-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-40 bg-background"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="follow_up">Follow-up</SelectItem>
                <SelectItem value="concern">Concern</SelectItem>
                <SelectItem value="celebration">Celebration</SelectItem>
                <SelectItem value="legal">Legal</SelectItem>
                <SelectItem value="hr">HR</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" className="gold-glow-hover" disabled={!noteText.trim() || createNote.isPending} onClick={() => createNote.mutate()}>
              {createNote.isPending ? "Adding..." : "Add Note"}
            </Button>
          </div>
        </div>
      )}
      {displayNotes.length > 0 ? (
        <div className="space-y-3">
          {displayNotes.map((note: any) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={`capitalize text-[10px] border-0 ${categoryColors[note.category] ?? categoryColors.general}`}>{note.category?.replace("_", " ")}</Badge>
                <span className="text-xs text-muted-foreground">{note.author} · {new Date(note.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm">{note.note_text}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-8">No notes yet.</p>
      )}
    </div>
  );
}

/* ===================== ENGAGEMENT (NEW — Velocity) ===================== */
function EngagementSectionNew({ candidateId, candidate, isDemoMode }: { candidateId: string; candidate: Candidate; isDemoMode: boolean }) {
  const { checkins, velocity, isLoading } = useEngagementCheckins(isDemoMode ? undefined : candidateId);
  const { prediction: churnPrediction, isLoading: churnLoading } = useChurnPrediction(isDemoMode ? undefined : candidateId);

  // Legacy fallback for demo mode
  const score = candidate.engagement_score;
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";

  return (
    <div className="space-y-6">
      {/* Velocity Card (live data) */}
      {!isDemoMode && !isLoading && (
        <>
          <VelocityCard velocity={velocity} checkins={checkins} />
          <ChurnPredictionCard prediction={churnPrediction} isLoading={churnLoading} />
          <EngagementChart checkins={checkins} />

          {/* Check-in History */}
          {checkins.length > 0 && (
            <div className="bg-card rounded-xl border border-border/50 p-5">
              <h3 className="text-sm font-semibold mb-3">Check-In History</h3>
              <div className="space-y-3">
                {[...checkins].reverse().map((c) => (
                  <div key={c.id} className="p-3 rounded-lg bg-muted/30 border border-border/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">Day {c.day_number} · {c.phase}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span>Mood: {MOOD_EMOJIS[c.mood - 1]} {MOOD_LABELS[c.mood - 1]}</span>
                      {c.confidence && <span>Confidence: {CONFIDENCE_EMOJIS[c.confidence - 1]} {CONFIDENCE_LABELS[c.confidence - 1]}</span>}
                      {c.team_integration && <span>Team: {TEAM_EMOJIS[c.team_integration - 1]} {TEAM_LABELS[c.team_integration - 1]}</span>}
                    </div>
                    {c.concerns && <p className="text-xs text-warning mt-1">⚠️ {c.concerns}</p>}
                    {c.wins && <p className="text-xs text-success mt-1">🎉 {c.wins}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Legacy engagement score */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Engagement Score</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <motion.path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none"
                stroke={score >= 80 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                strokeWidth="3" strokeLinecap="round" initial={{ strokeDasharray: "0, 100" }} animate={{ strokeDasharray: `${score}, 100` }} transition={{ duration: 1.2 }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className={`text-2xl font-bold ${color}`}>{score}</span></div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${color}`}>{score >= 80 ? "Highly Engaged" : score >= 50 ? "Moderate — Attention Needed" : "At Risk — Immediate Action"}</p>
            <p className="text-xs text-muted-foreground mt-1">Last contact: {candidate.last_contact_date}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===================== LEGACY ENGAGEMENT (kept for reference) ===================== */
function EngagementSection({ candidate }: { candidate: Candidate }) {
  return null; // replaced by EngagementSectionNew
}

/* ===================== PLACEHOLDER ===================== */
function PlaceholderSection({ title, emoji, description, isPlaceholder = false }: { title: string; emoji: string; description: string; isPlaceholder?: boolean }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className={`flex flex-col items-center justify-center py-12 ${isPlaceholder ? "opacity-60" : ""}`}>
        <span className="text-4xl mb-3">{emoji}</span>
        <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
        {isPlaceholder && <Badge variant="secondary" className="mt-3">Coming Soon</Badge>}
      </div>
    </div>
  );
}