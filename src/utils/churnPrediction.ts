// ─── 6-Week Churn Prediction Engine ─────────────────────
import type { EngagementCheckin } from "@/utils/velocityScoring";

export interface ChurnPrediction {
  probability: number;
  riskLevel: "low" | "moderate" | "high" | "critical";
  confidence: "low" | "medium" | "high";
  factors: ChurnFactor[];
  protectiveFactors: string[];
  recommendedActions: string[];
  predictedWeek: number | null;
}

export interface ChurnFactor {
  name: string;
  weight: number;
  description: string;
  severity: "low" | "medium" | "high";
}

interface PlacementRiskInput {
  risk_level: string;
  risk_score: number;
}

interface BuddyInput {
  id: string;
  status: string;
}

interface JourneyInput {
  start_work_date?: string | null;
  start_date?: string | null;
}

interface JourneyEventInput {
  status: string;
  scheduled_for?: string | null;
}

export function predictChurn(
  checkins: EngagementCheckin[],
  journey: JourneyInput,
  journeyEvents: JourneyEventInput[],
  buddyAssignment: BuddyInput | null,
  placementRisk: PlacementRiskInput | null,
): ChurnPrediction {
  let riskScore = 0;
  const factors: ChurnFactor[] = [];
  const protectiveFactors: string[] = [];

  // ═══ FACTOR 1: ENGAGEMENT TRAJECTORY (weight: 30%) ═══
  if (checkins.length >= 2) {
    const sorted = [...checkins].sort((a, b) => a.day_number - b.day_number);
    const recentTwo = sorted.slice(-2);
    const moodDelta = recentTwo[1].mood - recentTwo[0].mood;

    if (moodDelta < -1) {
      riskScore += 30;
      factors.push({
        name: "Sharp engagement decline",
        weight: 30,
        description: `Mood dropped from ${recentTwo[0].mood}/5 to ${recentTwo[1].mood}/5 between check-ins`,
        severity: "high",
      });
    } else if (moodDelta < 0) {
      riskScore += 15;
      factors.push({
        name: "Declining engagement",
        weight: 15,
        description: "Mood trending downward between check-ins",
        severity: "medium",
      });
    } else if (moodDelta > 0) {
      protectiveFactors.push("Engagement trending upward");
    }
  } else if (checkins.length === 1 && checkins[0].mood <= 2) {
    riskScore += 20;
    factors.push({
      name: "Low initial engagement",
      weight: 20,
      description: `First check-in recorded mood of ${checkins[0].mood}/5`,
      severity: "medium",
    });
  }

  // ═══ FACTOR 2: 72-HOUR VELOCITY (weight: 25%) ═══
  const day3Checkin = checkins.find((c) => c.day_number === 3);
  if (day3Checkin) {
    if (day3Checkin.mood <= 2) {
      riskScore += 25;
      factors.push({
        name: "72-hour velocity failure",
        weight: 25,
        description: "⚡ Day 3 check-in showed struggling/uncertain. Strongest predictor of 90-day departure.",
        severity: "high",
      });
    } else if (day3Checkin.mood === 3) {
      riskScore += 10;
      factors.push({
        name: "Neutral 72-hour velocity",
        weight: 10,
        description: "Day 3 check-in was neutral — not concerning alone, but watch closely.",
        severity: "low",
      });
    } else {
      protectiveFactors.push("Passed 72-hour velocity check");
    }
  }

  // ═══ FACTOR 3: BUDDY ENGAGEMENT (weight: 15%) ═══
  if (!buddyAssignment) {
    riskScore += 15;
    factors.push({
      name: "No buddy assigned",
      weight: 15,
      description: "No buddy relationship established. New hire lacks peer support.",
      severity: "high",
    });
  } else {
    const integrationScores = checkins
      .filter((c) => c.team_integration !== null)
      .map((c) => c.team_integration!);

    if (integrationScores.length > 0) {
      const avgIntegration = integrationScores.reduce((a, b) => a + b, 0) / integrationScores.length;
      if (avgIntegration <= 2) {
        riskScore += 15;
        factors.push({
          name: "Poor team integration",
          weight: 15,
          description: `Average team integration score: ${avgIntegration.toFixed(1)}/5. Buddy relationship may not be working.`,
          severity: "high",
        });
      } else if (avgIntegration >= 4) {
        protectiveFactors.push("Strong team integration");
      }
    }
  }

  // ═══ FACTOR 4: JOURNEY COMPLETION (weight: 10%) ═══
  const totalEvents = journeyEvents.length;
  const overdueEvents = journeyEvents.filter(
    (e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < new Date()
  ).length;
  const skippedEvents = journeyEvents.filter((e) => e.status === "skipped").length;
  const neglectRatio = (overdueEvents + skippedEvents) / Math.max(totalEvents, 1);

  if (neglectRatio > 0.3) {
    riskScore += 10;
    factors.push({
      name: "Journey neglect",
      weight: 10,
      description: `${overdueEvents} overdue and ${skippedEvents} skipped events. Property may not be investing in this hire.`,
      severity: "medium",
    });
  } else if (neglectRatio === 0 && totalEvents > 5) {
    protectiveFactors.push("All journey events completed on time");
  }

  // ═══ FACTOR 5: PLACEMENT RISK (weight: 10%) ═══
  if (placementRisk) {
    if (placementRisk.risk_level.toUpperCase() === "HIGH") {
      riskScore += 10;
      factors.push({
        name: "High placement risk",
        weight: 10,
        description: `DNA profile suggests mismatch with current role or team composition. Score: ${placementRisk.risk_score}/100.`,
        severity: "medium",
      });
    } else if (placementRisk.risk_level.toUpperCase() === "LOW") {
      protectiveFactors.push("Strong DNA fit with role and team");
    }
  }

  // ═══ FACTOR 6: CONFIDENCE TRAJECTORY (weight: 10%) ═══
  const confidenceScores = checkins
    .filter((c) => c.confidence !== null)
    .map((c) => c.confidence!);

  if (confidenceScores.length >= 2) {
    const latest = confidenceScores[confidenceScores.length - 1];
    const previous = confidenceScores[confidenceScores.length - 2];

    if (latest <= 2 && previous <= 2) {
      riskScore += 10;
      factors.push({
        name: "Persistently low confidence",
        weight: 10,
        description: "Confidence has remained low across multiple check-ins. May feel out of depth.",
        severity: "high",
      });
    } else if (latest >= 4) {
      protectiveFactors.push("High confidence in role");
    }
  }

  // ═══ CALCULATE FINAL PREDICTION ═══
  const probability = Math.min(95, riskScore);

  let riskLevel: ChurnPrediction["riskLevel"];
  if (probability < 25) riskLevel = "low";
  else if (probability < 50) riskLevel = "moderate";
  else if (probability < 75) riskLevel = "high";
  else riskLevel = "critical";

  let confidence: ChurnPrediction["confidence"];
  if (checkins.length >= 3 && day3Checkin) confidence = "high";
  else if (checkins.length >= 1) confidence = "medium";
  else confidence = "low";

  let predictedWeek: number | null = null;
  if (probability >= 50) {
    const startDate = journey.start_work_date || journey.start_date;
    const currentDay = startDate
      ? Math.floor((Date.now() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const currentWeek = Math.ceil(currentDay / 7);
    const weeksUntilDeparture = Math.max(1, Math.round((100 - probability) / 15));
    predictedWeek = currentWeek + weeksUntilDeparture;
  }

  const recommendedActions = generateChurnRecommendations(factors, protectiveFactors, probability);

  return {
    probability,
    riskLevel,
    confidence,
    factors: factors.sort((a, b) => b.weight - a.weight),
    protectiveFactors,
    recommendedActions,
    predictedWeek,
  };
}

function generateChurnRecommendations(
  factors: ChurnFactor[],
  protectiveFactors: string[],
  probability: number,
): string[] {
  const actions: string[] = [];
  const factorNames = factors.map((f) => f.name);

  if (probability >= 75) {
    actions.push("🚨 IMMEDIATE: Schedule 1-on-1 with manager within 24 hours");
    actions.push("Assess whether role change or team reassignment is needed");
  }

  if (factorNames.includes("72-hour velocity failure")) {
    actions.push("Review Day 1-3 experience — what went wrong?");
    actions.push("Consider intensive buddy support for next 2 weeks");
  }

  if (factorNames.includes("No buddy assigned") || factorNames.includes("Poor team integration")) {
    actions.push("Assign or reassign buddy immediately");
    actions.push("Arrange team social activity within the week");
  }

  if (factorNames.includes("Journey neglect")) {
    actions.push("Complete overdue journey events — property needs to invest");
    actions.push("Schedule call with property manager to discuss onboarding commitment");
  }

  if (factorNames.includes("High placement risk")) {
    actions.push("Review DNA profile against current role requirements");
    actions.push("Consider trial in alternative department matching DNA strengths");
  }

  if (factorNames.includes("Persistently low confidence")) {
    actions.push("Adjust training pace — may be too fast or too slow");
    actions.push("Identify specific skill gaps and provide targeted support");
  }

  if (factorNames.includes("Sharp engagement decline")) {
    actions.push("Investigate what changed — new manager? shift change? incident?");
    actions.push("Compare timeline of decline with any workplace events");
  }

  if (probability < 25 && protectiveFactors.length >= 2) {
    actions.push("This person is thriving — celebrate and reinforce what's working");
  }

  return actions;
}

export const CHURN_RISK_COLORS = {
  low: { text: "text-success", bg: "bg-success/10", border: "border-success/30", dot: "🟢" },
  moderate: { text: "text-warning", bg: "bg-warning/10", border: "border-warning/30", dot: "🟡" },
  high: { text: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "🟠" },
  critical: { text: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", dot: "🔴" },
} as const;
