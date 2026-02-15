import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertTriangle, ChevronDown, ChevronUp, Shield, ArrowRight } from "lucide-react";
import type { Archetype } from "@/data/mockData";

interface PlacementRiskAlertProps {
  candidateArchetype?: Archetype;
  candidateName: string;
  organizationName?: string;
  isDemoMode: boolean;
}

interface RiskFactor {
  type: "high" | "moderate" | "low";
  message: string;
}

interface AlternativePlacement {
  department: string;
  teamComposition: string;
  compatibility: number;
  riskScore: number;
  riskLevel: "low" | "moderate" | "high";
}

// Simulate risk calculation based on archetype
function calculatePlacementRisk(archetype?: Archetype): {
  score: number;
  level: "low" | "moderate" | "high";
  factors: RiskFactor[];
  recommendations: string[];
  alternatives: AlternativePlacement[];
} {
  if (!archetype) return { score: 0, level: "low", factors: [], recommendations: [], alternatives: [] };

  // Simulated team composition analysis
  if (archetype === "lion") {
    return {
      score: 72,
      level: "high",
      factors: [
        { type: "high", message: "Team Composition: Kitchen is 58% Lions — adding another Lion increases conflict risk" },
        { type: "high", message: "Management Clash: Head Chef (Lion) + Candidate (Lion) = potential power struggle" },
        { type: "moderate", message: "Career Goals: Wants leadership role within 12 months, but typical timeline is 24 months" },
      ],
      recommendations: [
        "Consider placing in FOH Management instead (currently only 1 Lion)",
        "Or pair with Whale-archetype manager to balance dynamics",
        "Set clear leadership pathway expectations upfront",
      ],
      alternatives: [
        { department: "Front of House Management", teamComposition: "1 Lion, 6 Whales, 1 Falcon", compatibility: 89, riskScore: 18, riskLevel: "low" },
        { department: "Events & Banqueting", teamComposition: "0 Lions, 3 Whales, 2 Falcons", compatibility: 82, riskScore: 25, riskLevel: "low" },
      ],
    };
  }

  if (archetype === "falcon") {
    return {
      score: 45,
      level: "moderate",
      factors: [
        { type: "moderate", message: "Team has 60% Falcons — adding another may reduce initiative" },
        { type: "low", message: "Manager (Whale) is a complementary pairing" },
      ],
      recommendations: [
        "Pair with a Lion team member to encourage initiative",
        "Set clear process ownership goals",
      ],
      alternatives: [
        { department: "Quality Assurance", teamComposition: "1 Lion, 2 Whales, 1 Falcon", compatibility: 78, riskScore: 30, riskLevel: "low" },
      ],
    };
  }

  // Whale - generally low risk
  return {
    score: 22,
    level: "low",
    factors: [
      { type: "low", message: "Balanced team composition — Whale adds collaborative strength" },
      { type: "low", message: "Manager (Lion) is complementary — ideal mentorship dynamic" },
    ],
    recommendations: [
      "Excellent cultural fit — proceed with confidence",
      "Buddy pairing with existing Whale team member recommended",
    ],
    alternatives: [],
  };
}

export function PlacementRiskAlert({ candidateArchetype, candidateName, organizationName, isDemoMode }: PlacementRiskAlertProps) {
  const [expanded, setExpanded] = useState(false);
  const [overridden, setOverridden] = useState(false);

  if (!candidateArchetype) return null;

  const risk = calculatePlacementRisk(candidateArchetype);
  if (risk.level === "low" && !isDemoMode) return null; // Don't show for low risk in non-demo

  const alertColors = {
    high: "bg-destructive/10 border-destructive/30",
    moderate: "bg-primary/10 border-primary/30",
    low: "bg-success/10 border-success/30",
  };

  const scoreColors = {
    high: "text-destructive",
    moderate: "text-primary",
    low: "text-success",
  };

  const factorColors = {
    high: "text-destructive",
    moderate: "text-primary",
    low: "text-success",
  };

  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border p-4 mb-6 ${alertColors[risk.level]}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {risk.level === "high" ? (
            <span className="text-lg">🚨</span>
          ) : risk.level === "moderate" ? (
            <AlertTriangle className="w-5 h-5 text-primary" />
          ) : (
            <Shield className="w-5 h-5 text-success" />
          )}
          <div>
            <p className={`text-sm font-semibold ${scoreColors[risk.level]}`}>
              {risk.level === "high" ? "High" : risk.level === "moderate" ? "Moderate" : "Low"} Placement Risk
              <span className="ml-2 font-normal">(Score: {risk.score}/100)</span>
            </p>
            <p className="text-xs text-muted-foreground">
              {candidateName} ({candidateArchetype}) → {organizationName || "Target Organization"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 space-y-4">
              {/* Risk Factors */}
              <div className="space-y-2">
                {risk.factors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-xs mt-0.5 ${factorColors[factor.type]}`}>⚠️</span>
                    <p className="text-xs">{factor.message}</p>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs font-semibold mb-2">Recommendations:</p>
                {risk.recommendations.map((rec, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-1">
                    <span>•</span>{rec}
                  </p>
                ))}
              </div>

              {/* Alternative Placements */}
              {risk.alternatives.length > 0 && (
                <div>
                  <p className="text-xs font-semibold mb-2">Alternative Placements:</p>
                  <div className="space-y-2">
                    {risk.alternatives.map((alt, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center justify-between p-3 rounded-lg bg-success/5 border border-success/20">
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-success" />{alt.department}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Team: {alt.teamComposition}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-success">{alt.compatibility}%</p>
                          <p className="text-[10px] text-muted-foreground">Risk: {alt.riskScore}/100</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Override */}
              {risk.level !== "low" && (
                <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                  <Checkbox checked={overridden} onCheckedChange={(c) => setOverridden(!!c)} />
                  <span className="text-xs text-muted-foreground">Override risk — proceed with current placement</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
