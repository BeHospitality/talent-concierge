import { useState, useEffect, useMemo } from "react";
import { mockCandidates, type CandidateStage, type Candidate } from "@/data/mockData";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { useCandidates, type DbCandidate } from "@/hooks/useCandidates";
import PipelineTracker from "@/components/dashboard/PipelineTracker";
import StatsCards from "@/components/dashboard/StatsCards";
import CandidateGrid from "@/components/dashboard/CandidateGrid";
import AddCandidateDialog from "@/components/dashboard/AddCandidateDialog";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Download } from "lucide-react";
import { motion } from "framer-motion";

// Convert DB candidates to the Candidate shape used by UI components
function dbToCandidate(db: DbCandidate): Candidate {
  return {
    id: db.id,
    full_name: db.full_name,
    email: db.email,
    phone: db.phone ?? "",
    photo_url: db.photo_url ?? `https://api.dicebear.com/7.x/personas/svg?seed=${db.id}`,
    current_stage: db.current_stage as CandidateStage,
    days_in_stage: db.days_in_stage,
    risk_level: db.risk_level as "low" | "medium" | "high",
    engagement_score: db.engagement_score,
    last_contact_date: db.last_contact_date ?? "",
    referral_source: db.referral_source ?? "",
    current_location: db.current_location ?? "",
    desired_location: db.desired_location ?? "",
    organization_id: db.organization_id ?? "",
    prescreening_complete: db.prescreening_complete,
  };
}

export default function Dashboard() {
  const { isDemoMode } = useDemoMode();
  const { candidates: dbCandidates, isLoading } = useCandidates();
  const [activeStage, setActiveStage] = useState<CandidateStage | "all" | "at_risk">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Listen for global search events from Layout
  useEffect(() => {
    const handler = (e: Event) => setSearchQuery((e as CustomEvent).detail);
    window.addEventListener("global-search", handler);
    return () => window.removeEventListener("global-search", handler);
  }, []);

  const candidates: Candidate[] = useMemo(() => {
    const source = isDemoMode ? mockCandidates : dbCandidates.map(dbToCandidate);
    if (!searchQuery.trim()) return source;
    const q = searchQuery.toLowerCase();
    return source.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.current_location.toLowerCase().includes(q) ||
        c.desired_location.toLowerCase().includes(q)
    );
  }, [isDemoMode, dbCandidates, searchQuery]);

  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recruitment Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isDemoMode ? "Viewing demo data" : isLoading ? "Loading candidates..." : "Manage your active candidates"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          {isDemoMode ? (
            <Button size="sm" className="gap-2 gold-glow-hover" disabled>
              <Plus className="w-4 h-4" />
              Add Candidate
            </Button>
          ) : (
            <AddCandidateDialog />
          )}
        </div>
      </motion.div>

      <StatsCards candidates={candidates} onStatClick={setActiveStage} />

      <PipelineTracker
        candidates={candidates}
        activeStage={activeStage}
        onStageClick={setActiveStage}
      />

      <CandidateGrid candidates={candidates} activeStage={activeStage} />

      {!isDemoMode && !isLoading && candidates.length === 0 && !searchQuery && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">No candidates yet</h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Add your first candidate to get started, or enable Demo Mode to explore the platform with sample data.
          </p>
          <AddCandidateDialog
            trigger={
              <Button className="gap-2 gold-glow-hover">
                <Plus className="w-4 h-4" />
                Add Your First Candidate
              </Button>
            }
          />
        </motion.div>
      )}
    </div>
  );
}
