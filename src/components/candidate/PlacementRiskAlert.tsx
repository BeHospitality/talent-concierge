import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, ChevronDown, ChevronUp, Shield, ArrowRight } from "lucide-react";
import type { Archetype } from "@/data/mockData";

interface PlacementRiskAlertProps {
  candidateArchetype?: Archetype;
  candidateName: string;
  organizationName?: string;
  organizationId?: string;
  targetDepartment?: string;
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

function useCalculatePlacementRisk(
  candidateArchetype?: Archetype,
  organizationId?: string,
  targetDepartment?: string
) {
  return useQuery({
    queryKey: ["placement_risk", candidateArchetype, organizationId, targetDepartment],
    queryFn: async () => {
      if (!candidateArchetype || !organizationId) {
        return { score: 0, level: "low" as const, factors: [] as RiskFactor[], recommendations: [] as string[], alternatives: [] as AlternativePlacement[] };
      }

      const dept = targetDepartment || "Front Office";

      const { data: teamComp, error } = await supabase
        .from("team_members")
        .select("tribe_viral_archetype, department, role, full_name")
        .eq("organization_id", organizationId)
        .eq("department", dept);

      if (error) {
        console.error("Failed to fetch team composition:", error);
        return calculatePlacementRisk(candidateArchetype);
      }

      const total = teamComp?.length || 0;

      if (total === 0) {
        return {
          score: 15,
          level: "low" as const,
          factors: [
            { type: "low" as const, message: "First team member in this department - no archetype conflicts" }
          ],
          recommendations: [
            "Opportunity to set department culture and standards",
            "Consider pairing with experienced team member from another department for mentorship"
          ],
          alternatives: [] as AlternativePlacement[]
        };
      }

      const lions = teamComp.filter(t => t.tribe_viral_archetype === "lion").length;
      const whales = teamComp.filter(t => t.tribe_viral_archetype === "whale").length;
      const falcons = teamComp.filter(t => t.tribe_viral_archetype === "falcon").length;

      const lionPct = Math.round((lions / total) * 100);
      const whalePct = Math.round((whales / total) * 100);
      const falconPct = Math.round((falcons / total) * 100);

      let riskScore = 0;
      const factors: RiskFactor[] = [];
      const recommendations: string[] = [];

      if (candidateArchetype === "lion") {
        if (lionPct > 50) {
          riskScore += 30;
          factors.push({ type: "high", message: `Team Composition: ${dept} is ${lionPct}% Lions - adding another Lion increases conflict risk` });
          recommendations.push("Consider placing in a department with fewer Lions");
          recommendations.push("Or pair with a Whale-archetype manager to balance dynamics");
        }
        if (lions >= 2) {
          riskScore += 20;
          factors.push({ type: "high", message: `${lions} Lions already present - potential for power struggles without clear hierarchy` });
          recommendations.push("Set clear leadership pathway expectations upfront");
        }
        if (whalePct > 40) {
          factors.push({ type: "low", message: `Team has ${whalePct}% Whales - good collaborative balance for Lion leadership` });
        }
      }

      if (candidateArchetype === "falcon") {
        if (falconPct > 60) {
          riskScore += 20;
          factors.push({ type: "moderate", message: `Team has ${falconPct}% Falcons - adding another may reduce initiative and innovation` });
          recommendations.push("Pair with a Lion team member to encourage proactive decision-making");
          recommendations.push("Set clear process ownership goals to maintain engagement");
        }
        if (lionPct > 30 || whalePct > 30) {
          factors.push({ type: "low", message: "Balanced team composition - Falcon's precision will complement existing strengths" });
        }
      }

      if (candidateArchetype === "whale") {
        if (whalePct > 70) {
          riskScore += 10;
          factors.push({ type: "low", message: `Team is ${whalePct}% Whales - excellent collaborative environment but may need external drive` });
          recommendations.push("Consider adding Lion or Falcon to balance initiative");
        } else {
          factors.push({ type: "low", message: "Whale adds collaborative strength and team cohesion" });
          recommendations.push("Excellent cultural fit - proceed with confidence");
          recommendations.push("Buddy pairing with existing Whale team member recommended");
        }
      }

      const level: "low" | "moderate" | "high" =
        riskScore >= 50 ? "high" : riskScore >= 30 ? "moderate" : "low";

      // Get alternative departments
      const { data: allTeamMembers } = await supabase
        .from("team_members")
        .select("department, tribe_viral_archetype")
        .eq("organization_id", organizationId)
        .neq("department", dept);

      const deptGroups = (allTeamMembers || []).reduce((acc, member) => {
        if (!acc[member.department]) acc[member.department] = [];
        acc[member.department].push(member.tribe_viral_archetype);
        return acc;
      }, {} as Record<string, (string | null)[]>);

      const alternatives: AlternativePlacement[] = Object.entries(deptGroups)
        .map(([deptName, archetypes]) => {
          const deptLions = archetypes.filter(a => a === "lion").length;
          const deptWhales = archetypes.filter(a => a === "whale").length;
          const deptFalcons = archetypes.filter(a => a === "falcon").length;
          const deptTotal = archetypes.length;

          let compatibility = 50;
          let altRiskScore = 50;

          if (candidateArchetype === "lion") {
            const deptLionPct = (deptLions / deptTotal) * 100;
            if (deptLionPct < 30 && deptWhales > deptLions) {
              compatibility = 85;
              altRiskScore = 20;
            }
          }
          if (candidateArchetype === "whale") {
            compatibility = 80;
            altRiskScore = 25;
          }
          if (candidateArchetype === "falcon") {
            if (deptWhales > deptFalcons) {
              compatibility = 75;
              altRiskScore = 30;
            }
          }

          return {
            department: deptName,
            teamComposition: `${deptLions} ${deptLions === 1 ? 'Lion' : 'Lions'}, ${deptWhales} ${deptWhales === 1 ? 'Whale' : 'Whales'}, ${deptFalcons} ${deptFalcons === 1 ? 'Falcon' : 'Falcons'}`,
            compatibility,
            riskScore: altRiskScore,
            riskLevel: (altRiskScore < 30 ? "low" : "moderate") as "low" | "moderate"
          };
        })
        .filter(alt => alt.compatibility > 70 && alt.riskScore < riskScore)
        .sort((a, b) => b.compatibility - a.compatibility)
        .slice(0, 2);

      return { score: riskScore, level, factors, recommendations, alternatives };
    },
    enabled: !!candidateArchetype && !!organizationId
  });
}

export function PlacementRiskAlert({ candidateArchetype, candidateName, organizationName, organizationId, targetDepartment, isDemoMode }: PlacementRiskAlertProps) {
  const [expanded, setExpanded] = useState(false);
  const [overridden, setOverridden] = useState(false);

  const { data: liveRisk, isLoading } = useCalculatePlacementRisk(
    candidateArchetype,
    isDemoMode ? undefined : organizationId,
    isDemoMode ? undefined : targetDepartment
  );

  if (!candidateArchetype) return null;

  const risk = isDemoMode
    ? calculatePlacementRisk(candidateArchetype)
    : (liveRisk || { score: 0, level: "low" as const, factors: [], recommendations: [], alternatives: [] });

  if (!isDemoMode && isLoading) {
    return <Skeleton className="h-16 w-full rounded-xl mb-6" />;
  }

  if (risk.level === "low" && !isDemoMode) return null;

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
              <div className="space-y-2">
                {risk.factors.map((factor, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className={`text-xs mt-0.5 ${factorColors[factor.type]}`}>⚠️</span>
                    <p className="text-xs">{factor.message}</p>
                  </div>
                ))}
              </div>

              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs font-semibold mb-2">Recommendations:</p>
                {risk.recommendations.map((rec, i) => (
                  <p key={i} className="text-xs text-muted-foreground flex items-start gap-1.5 mb-1">
                    <span>•</span>{rec}
                  </p>
                ))}
              </div>

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
