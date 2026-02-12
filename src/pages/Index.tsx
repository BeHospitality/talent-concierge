import { useState } from "react";
import { mockCandidates, type CandidateStage } from "@/data/mockData";
import { useDemoMode } from "@/contexts/DemoModeContext";
import PipelineTracker from "@/components/dashboard/PipelineTracker";
import StatsCards from "@/components/dashboard/StatsCards";
import CandidateGrid from "@/components/dashboard/CandidateGrid";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle, Download } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { isDemoMode } = useDemoMode();
  const [activeStage, setActiveStage] = useState<CandidateStage | "all" | "at_risk">("all");

  const candidates = isDemoMode ? mockCandidates : [];

  return (
    <div className="max-w-[1600px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recruitment Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isDemoMode ? "Viewing demo data" : "Manage your active candidates"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button size="sm" className="gap-2 gold-glow-hover">
            <Plus className="w-4 h-4" />
            Add Candidate
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <StatsCards candidates={candidates} />

      {/* Pipeline Tracker */}
      <PipelineTracker
        candidates={candidates}
        activeStage={activeStage}
        onStageClick={setActiveStage}
      />

      {/* Candidate Grid */}
      <CandidateGrid candidates={candidates} activeStage={activeStage} />

      {/* Empty state for non-demo */}
      {!isDemoMode && candidates.length === 0 && (
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
          <Button className="gap-2 gold-glow-hover">
            <Plus className="w-4 h-4" />
            Add Your First Candidate
          </Button>
        </motion.div>
      )}
    </div>
  );
}
