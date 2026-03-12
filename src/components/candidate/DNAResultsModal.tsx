import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExternalLink, MapPin, Building, Briefcase } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DNAResultsModalProps {
  candidateId: string;
  candidateName: string;
  archetype: string;
  triggerButton?: React.ReactNode;
}

const ARCHETYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  lion: { emoji: "🦁", color: "hsl(38, 92%, 50%)" },
  whale: { emoji: "🐋", color: "hsl(210, 70%, 55%)" },
  falcon: { emoji: "🦅", color: "hsl(270, 60%, 55%)" },
};

const DIMENSION_LABELS: Record<string, string> = {
  autonomy: "Autonomy",
  collaboration: "Collaboration",
  precision: "Precision",
  adaptability: "Adaptability",
  leadership: "Leadership",
  resilience: "Resilience",
  creativity: "Creativity",
  empathy: "Empathy",
  initiative: "Initiative",
  accountability: "Accountability",
  communication: "Communication",
  problem_solving: "Problem Solving",
  time_management: "Time Management",
  attention_to_detail: "Attention to Detail",
  customer_focus: "Customer Focus",
  teamwork: "Teamwork",
  flexibility: "Flexibility",
  work_ethic: "Work Ethic",
  stress_tolerance: "Stress Tolerance",
  learning_agility: "Learning Agility",
  cultural_sensitivity: "Cultural Sensitivity",
  service_orientation: "Service Orientation",
  emotional_intelligence: "Emotional Intelligence",
};

export function DNAResultsModal({ candidateId, candidateName, archetype, triggerButton }: DNAResultsModalProps) {
  const config = ARCHETYPE_CONFIG[archetype] ?? ARCHETYPE_CONFIG.lion;

  const { data } = useQuery({
    queryKey: ["prescreening_full", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescreening_data")
        .select("*")
        .eq("candidate_id", candidateId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const dimensionScores = (data?.dimension_scores ?? {}) as Record<string, number>;
  const tribeViralScores = (data?.tribe_viral_scores ?? {}) as Record<string, number>;
  const sectorMatches = (data?.sector_matches ?? []) as string[];
  const geographyMatches = (data?.geography_matches ?? []) as string[];
  const departmentMatches = (data?.department_matches ?? []) as string[];
  const careerMilestones = (data?.career_compass_milestones ?? []) as string[];
  const retentionRisks = (data?.retention_risk_windows ?? []) as Array<{ window: string; risk: string }>;

  const allDimensions = Object.entries(dimensionScores)
    .map(([key, value]) => ({ key, label: DIMENSION_LABELS[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), score: value }))
    .sort((a, b) => b.score - a.score);

  const topDimensions = allDimensions.slice(0, 5);
  const remainingDimensions = allDimensions.slice(5);

  return (
    <Dialog>
      <DialogTrigger asChild>
        {triggerButton ?? (
          <Button variant="ghost" size="sm" className="gap-1 text-primary">
            <ExternalLink className="w-3.5 h-3.5" /> View Full Results
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl">{config.emoji}</span>
            <div>
              <p className="text-lg font-bold">{candidateName} — DNA Profile</p>
              <p className="text-sm text-muted-foreground font-normal capitalize">{archetype} Archetype</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Archetype Scores */}
          {Object.keys(tribeViralScores).length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Archetype Scores</h3>
              <div className="grid grid-cols-3 gap-3">
                {Object.entries(tribeViralScores).map(([key, value]) => (
                  <div key={key} className="rounded-lg p-3 bg-muted/30 border border-border/30 text-center">
                    <p className="text-2xl mb-1">{ARCHETYPE_CONFIG[key]?.emoji ?? "🔹"}</p>
                    <p className="text-sm font-semibold capitalize">{key}</p>
                    <p className="text-lg font-bold" style={{ color: config.color }}>{Math.round(value)}%</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Top 5 Dimensions */}
          {topDimensions.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Top Dimensions</h3>
              <div className="space-y-3">
                {topDimensions.map((dim, i) => (
                  <motion.div key={dim.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{dim.label}</span>
                      <span className="text-sm font-bold" style={{ color: config.color }}>{Math.round(dim.score)}%</span>
                    </div>
                    <Progress value={dim.score} className="h-2" />
                  </motion.div>
                ))}
              </div>
            </section>
          )}

          {/* Remaining Dimensions */}
          {remainingDimensions.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">All Other Dimensions</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {remainingDimensions.map((dim) => (
                  <div key={dim.key} className="flex items-center justify-between py-1 border-b border-border/20">
                    <span className="text-xs text-muted-foreground">{dim.label}</span>
                    <span className="text-xs font-semibold">{Math.round(dim.score)}%</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Matches */}
          {(sectorMatches.length > 0 || geographyMatches.length > 0 || departmentMatches.length > 0) && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Placement Matches</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sectorMatches.length > 0 && (
                  <div className="rounded-lg p-3 bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold">Sector</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {sectorMatches.map((s) => (
                        <Badge key={s} variant="secondary" className="text-[10px] capitalize">{s.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {geographyMatches.length > 0 && (
                  <div className="rounded-lg p-3 bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold">Geography</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {geographyMatches.map((g) => (
                        <Badge key={g} variant="secondary" className="text-[10px] capitalize">{g.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {departmentMatches.length > 0 && (
                  <div className="rounded-lg p-3 bg-muted/30 border border-border/30">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Building className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-semibold">Department</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {departmentMatches.map((d) => (
                        <Badge key={d} variant="secondary" className="text-[10px] capitalize">{d.replace(/_/g, " ")}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Retention Risk Windows */}
          {retentionRisks.length > 0 && (
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">Retention Risk Windows</h3>
              <div className="space-y-2">
                {retentionRisks.map((r, i) => (
                  <div key={i} className="p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-xs">
                    <span className="font-semibold text-destructive">⚠️ {r.window}</span>
                    <span className="text-muted-foreground ml-2">{r.risk}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
