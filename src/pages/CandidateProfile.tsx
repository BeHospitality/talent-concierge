import { useParams, Link } from "react-router-dom";
import { mockCandidates, STAGE_LABELS } from "@/data/mockData";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, ClipboardCheck, FileText, CalendarDays,
  FileSignature, CheckSquare, Users, Activity, GraduationCap,
  Home, StickyNote, MapPin, Phone, Mail, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

const sidebarItems = [
  { id: "personal", label: "Personal Info", icon: User },
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

export default function CandidateProfile() {
  const { id } = useParams();
  const { isDemoMode } = useDemoMode();
  const [activeSection, setActiveSection] = useState("personal");

  const candidate = isDemoMode ? mockCandidates.find((c) => c.id === id) : undefined;

  if (!candidate) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Candidate not found</p>
          <Link to="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAtRisk = candidate.risk_level === "high";
  const scores = candidate.tribe_viral_scores;

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* At-risk banner */}
      {isAtRisk && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-destructive/15 border border-destructive/30 rounded-xl p-4 mb-6 flex items-center gap-3"
        >
          <span className="text-lg">🚨</span>
          <div>
            <p className="text-sm font-semibold text-destructive">GHOSTING RISK</p>
            <p className="text-xs text-muted-foreground">
              No contact for {Math.floor((Date.now() - new Date(candidate.last_contact_date).getTime()) / 86400000)} days — Engagement score: {candidate.engagement_score}%
            </p>
          </div>
          <Button size="sm" variant="outline" className="ml-auto border-destructive/50 text-destructive hover:bg-destructive/10">
            Send Check-In
          </Button>
        </motion.div>
      )}

      {/* Back button + Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
        </Link>
      </div>

      <div className="flex gap-6">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-56 flex-shrink-0"
        >
          <div className="bg-card rounded-xl border border-border/50 p-3 sticky top-24">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeSection === item.id
                    ? "bg-primary/15 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            ))}
          </div>
        </motion.aside>

        {/* Main content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 min-w-0"
        >
          {/* Profile header card */}
          <div className="bg-card rounded-xl border border-border/50 p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 rounded-full bg-muted overflow-hidden border-2 border-border flex-shrink-0">
                <img src={candidate.photo_url} alt={candidate.full_name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-xl font-bold">{candidate.full_name}</h1>
                  <Badge variant={isAtRisk ? "destructive" : "secondary"}>
                    {STAGE_LABELS[candidate.current_stage]}
                  </Badge>
                  {candidate.archetype && (
                    <Badge variant="outline" className="capitalize">
                      {candidate.archetype}
                    </Badge>
                  )}
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
              <Button size="sm" className="gap-2 gold-glow-hover">
                <FileText className="w-4 h-4" /> Generate Dossier
              </Button>
            </div>
          </div>

          {/* Sections */}
          {activeSection === "personal" && <PersonalInfo candidate={candidate} />}
          {activeSection === "prescreening" && <PreScreening candidate={candidate} />}
          {activeSection === "dossier" && <PlaceholderSection title="Dossier & Submission" emoji="📄" description="Generate and track PIN-protected dossiers for hiring managers." />}
          {activeSection === "interviews" && <PlaceholderSection title="Interview Tracker" emoji="📅" description="Schedule and track interview rounds, outcomes, and notes." />}
          {activeSection === "offer" && <PlaceholderSection title="Offer Management" emoji="✍️" description="Create offers, track negotiations, and collect e-signatures." />}
          {activeSection === "logistics" && <LogisticsSection />}
          {activeSection === "buddy" && <PlaceholderSection title="Buddy Assignment" emoji="🤝" description="Match candidates with team buddies based on archetype compatibility." />}
          {activeSection === "engagement" && <EngagementSection candidate={candidate} />}
          {activeSection === "academy" && <PlaceholderSection title="Academy Training Progress" emoji="📚" description="Academy integration coming soon — track learning paths, quiz scores, and certifications." isPlaceholder />}
          {activeSection === "housing" && <PlaceholderSection title="Housing Accommodation" emoji="🏠" description="Housing integration coming soon — property details, lease status, and move-in coordination." isPlaceholder />}
          {activeSection === "notes" && <PlaceholderSection title="Notes & Timeline" emoji="📝" description="Internal notes and auto-generated activity timeline." />}
        </motion.div>
      </div>
    </div>
  );
}

function PersonalInfo({ candidate }: { candidate: typeof mockCandidates[0] }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[
          { label: "Full Name", value: candidate.full_name },
          { label: "Email", value: candidate.email },
          { label: "Phone", value: candidate.phone },
          { label: "Current Location", value: candidate.current_location },
          { label: "Desired Location", value: candidate.desired_location },
          { label: "Referral Source", value: candidate.referral_source },
        ].map((field) => (
          <div key={field.label}>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{field.label}</label>
            <p className="mt-1 text-sm font-medium">{field.value}</p>
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-6 pt-6 border-t border-border/50">
        <Button size="sm" className="gold-glow-hover">Save Changes</Button>
        <Button size="sm" variant="outline" className="text-destructive border-destructive/30 hover:bg-destructive/10">Delete Candidate</Button>
      </div>
    </div>
  );
}

function PreScreening({ candidate }: { candidate: typeof mockCandidates[0] }) {
  const scores = candidate.tribe_viral_scores;
  const dimensions = scores
    ? [
        { name: "Autonomy", score: scores.autonomy },
        { name: "Collaboration", score: scores.collaboration },
        { name: "Precision", score: scores.precision },
        { name: "Adaptability", score: scores.adaptability },
        { name: "Leadership", score: scores.leadership },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Tribe-Viral */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Tribe-Viral Assessment</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            <ExternalLink className="w-3.5 h-3.5" /> View Full Assessment
          </Button>
        </div>
        {candidate.archetype ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl">
                {candidate.archetype === "lion" ? "🦁" : candidate.archetype === "whale" ? "🐋" : "🦅"}
              </span>
              <div>
                <p className="font-semibold capitalize text-lg">{candidate.archetype} Archetype</p>
                <p className="text-sm text-muted-foreground">
                  {candidate.archetype === "lion"
                    ? "Natural leader, high autonomy, results-driven"
                    : candidate.archetype === "whale"
                    ? "Team player, collaborative, relationship-focused"
                    : "Detail-oriented, precise, quality-driven"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {dimensions.map((dim) => (
                <div key={dim.name} className="text-center">
                  <div className="relative w-full h-24 flex items-end justify-center mb-2">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${dim.score}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                      className={`w-8 rounded-t-md ${
                        dim.score >= 80 ? "bg-success" : dim.score >= 60 ? "bg-primary" : "bg-muted-foreground/30"
                      }`}
                    />
                  </div>
                  <p className="text-xs font-medium">{dim.name}</p>
                  <p className="text-xs text-muted-foreground">{dim.score}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Assessment pending</p>
        )}
      </div>

      {/* Career Compass */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Career Compass</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            <ExternalLink className="w-3.5 h-3.5" /> View Full Roadmap
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {["Become Head Chef within 2 years", "Achieve Michelin recognition", "Open own restaurant by 35"].map((milestone, i) => (
            <div key={i} className="bg-muted/50 rounded-lg p-4">
              <p className="text-xs text-muted-foreground mb-1">Milestone {i + 1}</p>
              <p className="text-sm font-medium">{milestone}</p>
            </div>
          ))}
        </div>

        {/* Pre-screening status */}
        <div className="mt-6 pt-6 border-t border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {candidate.prescreening_complete ? (
                <Badge className="bg-success/20 text-success border-0">✓ Pre-Screening Complete</Badge>
              ) : (
                <Badge variant="secondary">Pre-Screening Incomplete</Badge>
              )}
            </div>
            {candidate.prescreening_complete && (
              <Button size="sm" className="gold-glow-hover gap-2">
                <FileText className="w-4 h-4" /> Generate Dossier
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function LogisticsSection() {
  const items = [
    { name: "Visa Status", status: "in_progress", enabled: true },
    { name: "Police Check", status: "complete", enabled: true },
    { name: "Flight Booking", status: "pending", enabled: true },
    { name: "Housing Secured", status: "pending", enabled: true },
    { name: "Academy Training", status: "pending", enabled: false },
    { name: "Pre-Arrival Call", status: "pending", enabled: true },
  ];
  const completed = items.filter((i) => i.status === "complete" && i.enabled).length;
  const total = items.filter((i) => i.enabled).length;
  const pct = Math.round((completed / total) * 100);

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold mb-4">Pre-Arrival Logistics</h2>
      <div className="mb-6">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-muted-foreground">{completed} of {total} items complete</span>
          <span className="font-semibold text-primary">{pct}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8 }}
            className="h-full bg-primary rounded-full"
          />
        </div>
      </div>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className={`flex items-center justify-between p-3 rounded-lg ${item.enabled ? "bg-muted/30" : "bg-muted/10 opacity-50"}`}>
            <div className="flex items-center gap-3">
              <div className={`w-2.5 h-2.5 rounded-full ${
                item.status === "complete" ? "bg-success" : item.status === "in_progress" ? "bg-primary" : "bg-muted-foreground/30"
              }`} />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            <Badge variant="secondary" className="capitalize text-[10px]">{item.status.replace("_", " ")}</Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

function EngagementSection({ candidate }: { candidate: typeof mockCandidates[0] }) {
  const score = candidate.engagement_score;
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";

  const timeline = [
    { type: "email_sent", date: "Feb 10", label: "Check-in email sent" },
    { type: "email_opened", date: "Feb 10", label: "Email opened" },
    { type: "checkin_completed", date: "Feb 8", label: "Check-in completed" },
    { type: "interview_attended", date: "Feb 5", label: "Interview attended — Round 1" },
    { type: "form_submitted", date: "Feb 3", label: "Career Compass submitted" },
    { type: "form_submitted", date: "Feb 1", label: "Tribe-Viral assessment completed" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Engagement Score</h2>
        <div className="flex items-center gap-6">
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="hsl(var(--muted))" strokeWidth="3" />
              <motion.path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={score >= 80 ? "hsl(var(--success))" : score >= 50 ? "hsl(var(--primary))" : "hsl(var(--destructive))"}
                strokeWidth="3"
                strokeLinecap="round"
                initial={{ strokeDasharray: "0, 100" }}
                animate={{ strokeDasharray: `${score}, 100` }}
                transition={{ duration: 1.2 }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-2xl font-bold ${color}`}>{score}</span>
            </div>
          </div>
          <div>
            <p className={`text-sm font-semibold ${color}`}>
              {score >= 80 ? "Highly Engaged" : score >= 50 ? "Moderate — Attention Needed" : "At Risk — Immediate Action"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Last contact: {candidate.last_contact_date}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border/50 p-6">
        <h2 className="text-lg font-semibold mb-4">Activity Timeline</h2>
        <div className="space-y-4">
          {timeline.map((event, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-start gap-3"
            >
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                {event.type.includes("email") ? <Mail className="w-3.5 h-3.5 text-muted-foreground" /> :
                 event.type.includes("interview") ? <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> :
                 <ClipboardCheck className="w-3.5 h-3.5 text-muted-foreground" />}
              </div>
              <div>
                <p className="text-sm font-medium">{event.label}</p>
                <p className="text-xs text-muted-foreground">{event.date}, 2026</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PlaceholderSection({ title, emoji, description, isPlaceholder = false }: { title: string; emoji: string; description: string; isPlaceholder?: boolean }) {
  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className={`flex flex-col items-center justify-center py-12 ${isPlaceholder ? "opacity-60" : ""}`}>
        <span className="text-4xl mb-3">{emoji}</span>
        <p className="text-sm text-muted-foreground text-center max-w-md">{description}</p>
        {isPlaceholder && (
          <Badge variant="secondary" className="mt-3">Coming Soon</Badge>
        )}
      </div>
    </div>
  );
}
