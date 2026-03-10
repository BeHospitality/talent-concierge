import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ExternalLink } from "lucide-react";
import { SendAssessmentDialog } from "./SendAssessmentDialog";
import type { Candidate } from "@/data/mockData";

interface PreScreeningSectionProps {
  candidate: Candidate;
  isDemoMode: boolean;
  onUpdate?: (updates: Record<string, any>) => void;
}

const ARCHETYPE_CONFIG = {
  lion: { emoji: "🦁", tagline: "Natural leader, high autonomy, results-driven", color: "text-primary" },
  whale: { emoji: "🐋", tagline: "Team player, collaborative, relationship-focused", color: "text-blue-400" },
  falcon: { emoji: "🦅", tagline: "Detail-oriented, precise, quality-driven", color: "text-purple-400" },
};

const ARCHETYPE_TRAITS: Record<string, string[]> = {
  lion: [
    "Natural leader with high autonomy drive",
    "Thrives in decision-making roles",
    "May clash with micro-management",
    "Best with ownership-based roles",
  ],
  whale: [
    "Exceptional team collaborator",
    "Builds strong relationships quickly",
    "Thrives in supportive environments",
    "Best with team-oriented roles",
  ],
  falcon: [
    "Highly detail-oriented and precise",
    "Excels at process optimization",
    "May need encouragement for initiative",
    "Best with quality-focused roles",
  ],
};

export function PreScreeningSection({ candidate, isDemoMode, onUpdate }: PreScreeningSectionProps) {
  const scores = candidate.tribe_viral_scores;
  const archetype = candidate.archetype;
  const config = archetype ? ARCHETYPE_CONFIG[archetype] : null;
  const traits = archetype ? ARCHETYPE_TRAITS[archetype] : [];

  const dimensions = scores
    ? [
        { name: "Autonomy", score: scores.autonomy, key: "autonomy" },
        { name: "Collaboration", score: scores.collaboration, key: "collaboration" },
        { name: "Precision", score: scores.precision, key: "precision" },
        { name: "Adaptability", score: scores.adaptability, key: "adaptability" },
        { name: "Leadership", score: scores.leadership, key: "leadership" },
      ]
    : [];

  // Radar chart SVG calculation
  const radarSize = 200;
  const center = radarSize / 2;
  const radius = 80;
  const angleStep = (2 * Math.PI) / 5;

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) };
  };

  const radarPoints = dimensions.map((d, i) => getPoint(i, d.score));
  const radarPath = radarPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  const archetypeColor = archetype === "lion" ? "hsl(38, 92%, 50%)" : archetype === "whale" ? "hsl(210, 70%, 55%)" : "hsl(270, 60%, 55%)";

  const hasCareerCompass = candidate.prescreening_complete && archetype;

  const retentionRisks = archetype === "lion" ? ["Month 6-8: May seek leadership if not given autonomy"] : [];

  return (
    <div className="space-y-6">
      {/* Send Assessment */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Pre-Screening Assessment</h2>
          <SendAssessmentDialog
            candidateId={candidate.id}
            candidateName={candidate.full_name}
            candidateEmail={candidate.email}
            candidatePhone={candidate.phone}
            isDemoMode={isDemoMode}
          />
        </div>

        {!archetype && !scores && (
          <div className="flex flex-col items-center justify-center py-10">
            <Badge variant="secondary" className="mb-3">Assessment Sent — Awaiting Completion</Badge>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              The candidate's DNA profile assessment has been sent. Results will appear here once completed.
            </p>
          </div>
        )}
      </div>

      {/* Archetype & Radar Chart */}
      {archetype && scores && (
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tribe-Viral Profile</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              <ExternalLink className="w-3.5 h-3.5" /> View Full Results
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Archetype Card */}
            <div>
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-4 mb-6 p-4 rounded-xl bg-muted/30 border border-border/30">
                <span className="text-5xl">{config?.emoji}</span>
                <div>
                  <p className={`font-bold capitalize text-xl ${config?.color}`}>{archetype} Archetype</p>
                  <p className="text-sm text-muted-foreground">{config?.tagline}</p>
                </div>
              </motion.div>

              {/* Key Traits */}
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2">Key Traits</p>
                {traits.map((trait, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-2 text-sm">
                    <span className="text-primary mt-0.5">•</span>
                    <span>{trait}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="flex flex-col items-center">
              <svg width={radarSize} height={radarSize} className="overflow-visible">
                {/* Grid rings */}
                {[20, 40, 60, 80, 100].map((level) => (
                  <polygon key={level}
                    points={Array.from({ length: 5 }, (_, i) => {
                      const p = getPoint(i, level);
                      return `${p.x},${p.y}`;
                    }).join(" ")}
                    fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.4} />
                ))}
                {/* Axis lines */}
                {dimensions.map((_, i) => {
                  const p = getPoint(i, 100);
                  return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.5" opacity={0.3} />;
                })}
                {/* Data polygon */}
                <motion.polygon
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8 }}
                  points={radarPoints.map(p => `${p.x},${p.y}`).join(" ")}
                  fill={archetypeColor} fillOpacity={0.2}
                  stroke={archetypeColor} strokeWidth="2" />
                {/* Data points */}
                {radarPoints.map((p, i) => (
                  <motion.circle key={i} cx={p.x} cy={p.y} r="4"
                    fill={archetypeColor} initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1 }} />
                ))}
                {/* Labels */}
                {dimensions.map((d, i) => {
                  const p = getPoint(i, 120);
                  return (
                    <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
                      className="fill-foreground text-[10px] font-medium">
                      {d.name} ({d.score})
                    </text>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Dimension Bars */}
          <div className="grid grid-cols-5 gap-3 mt-6 pt-6 border-t border-border/50">
            {dimensions.map((dim) => (
              <div key={dim.name} className="text-center">
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-1">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${dim.score}%` }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: archetypeColor }} />
                </div>
                <p className="text-[10px] font-medium">{dim.name}</p>
                <p className="text-[10px] text-muted-foreground">{dim.score}%</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasCareerCompass && (
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Career Compass</h2>
            <Button variant="ghost" size="sm" className="gap-1 text-primary">
              <ExternalLink className="w-3.5 h-3.5" /> View Full Roadmap
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(isDemoMode
              ? ["Become Head Chef within 2 years", "Achieve Michelin recognition", "Open own restaurant by 35"]
              : []
            ).map((milestone, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-lg p-4 ${i === 0 ? "bg-primary/10 border border-primary/20" : "bg-muted/50"}`}>
                <p className="text-xs text-muted-foreground mb-1">
                  {i === 0 ? "🎯 6-Month Goal" : `Milestone ${i + 1}`}
                </p>
                <p className="text-sm font-medium">{milestone}</p>
              </motion.div>
            ))}
          </div>

          {retentionRisks.length > 0 && (
            <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-xs font-semibold text-destructive mb-1">⚠️ Retention Risk Windows</p>
              {retentionRisks.map((risk, i) => (
                <p key={i} className="text-xs text-muted-foreground">{risk}</p>
              ))}
          </div>
        )}
        </div>
      )}

      {/* Status Toggle */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {!isDemoMode && onUpdate ? (
              <div className="flex items-center gap-2">
                <Checkbox checked={candidate.prescreening_complete}
                  onCheckedChange={(checked) => onUpdate({ prescreening_complete: !!checked })} />
                <span className="text-sm font-medium">Mark as Pre-Screening Complete</span>
              </div>
            ) : (
              candidate.prescreening_complete ? (
                <Badge className="bg-success/20 text-success border-0">✓ Pre-Screening Complete</Badge>
              ) : (
                <Badge variant="secondary">Pre-Screening Incomplete</Badge>
              )
            )}
          </div>
          {candidate.prescreening_complete && (
            <div className="flex gap-2">
              <Badge className="bg-success/10 text-success border-0 text-[10px]">Dossier Unlocked</Badge>
              <Badge className="bg-success/10 text-success border-0 text-[10px]">Submit Unlocked</Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
