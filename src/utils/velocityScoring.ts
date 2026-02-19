// ─── Engagement Velocity Scoring Engine ─────────────────────

export interface EngagementCheckin {
  id: string;
  candidate_id: string;
  journey_id: string;
  journey_event_id?: string | null;
  organization_id?: string | null;
  day_number: number;
  phase: string;
  mood: number;
  confidence: number | null;
  team_integration: number | null;
  notes: string | null;
  concerns: string | null;
  wins: string | null;
  recorded_by: string;
  created_at: string;
}

export interface VelocityScore {
  score: number;
  level: "thriving" | "stable" | "watch" | "at_risk" | "critical";
  trend: "improving" | "stable" | "declining";
  riskFactors: string[];
  recommendations: string[];
}

export const VELOCITY_LEVELS = {
  thriving: { label: "Thriving", color: "text-success", bg: "bg-success/10", border: "border-success/30", dot: "🟢" },
  stable: { label: "Stable", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30", dot: "🔵" },
  watch: { label: "Watch", color: "text-warning", bg: "bg-warning/10", border: "border-warning/30", dot: "🟡" },
  at_risk: { label: "At Risk", color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/30", dot: "🟠" },
  critical: { label: "Critical", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", dot: "🔴" },
} as const;

export const TREND_ARROWS = {
  improving: "↑",
  stable: "→",
  declining: "↓",
} as const;

export const DAY_LABELS: Record<number, { title: string; subtitle: string; critical?: boolean }> = {
  0: { title: "Day 1 Check-In", subtitle: "How was their first day?" },
  1: { title: "Day 1 Check-In", subtitle: "How was their first day?" },
  3: { title: "72-Hour Velocity", subtitle: "Critical checkpoint — this predicts 90-day success", critical: true },
  7: { title: "Week 1 Wrap-Up", subtitle: "End of first week assessment" },
  14: { title: "Week 2 Check-In", subtitle: "Are they settling in?" },
  30: { title: "30-Day Review", subtitle: "One month milestone" },
  45: { title: "Mid-Probation", subtitle: "Halfway through probation" },
  60: { title: "60-Day Review", subtitle: "Two month assessment" },
  90: { title: "Probation Complete", subtitle: "Final assessment" },
};

export const MOOD_EMOJIS = ["😟", "😕", "😐", "😊", "😁"];
export const MOOD_LABELS = ["Struggling", "Uncertain", "Neutral", "Good", "Thriving"];
export const CONFIDENCE_EMOJIS = ["😰", "🤔", "😐", "💪", "⭐"];
export const CONFIDENCE_LABELS = ["Lost", "Unsure", "Getting there", "Confident", "Owning it"];
export const TEAM_EMOJIS = ["🚶", "😶", "🤝", "👥", "👨‍👩‍👧‍👦"];
export const TEAM_LABELS = ["Isolated", "Awkward", "Fitting in", "Connected", "Part of the family"];

function calculateCheckinScore(checkin: EngagementCheckin): number {
  const mood = ((checkin.mood - 1) / 4) * 100;
  const confidence = checkin.confidence ? ((checkin.confidence - 1) / 4) * 100 : mood;
  const integration = checkin.team_integration ? ((checkin.team_integration - 1) / 4) * 100 : mood;
  return Math.round(mood * 0.5 + confidence * 0.25 + integration * 0.25);
}

export function calculateVelocity(checkins: EngagementCheckin[]): VelocityScore {
  if (checkins.length === 0) {
    return {
      score: 50,
      level: "watch",
      trend: "stable",
      riskFactors: ["No check-in data yet"],
      recommendations: ["Complete Day 1 check-in"],
    };
  }

  const sorted = [...checkins].sort((a, b) => a.day_number - b.day_number);
  const latest = sorted[sorted.length - 1];

  // Weighted score: recent check-ins matter more
  let weightedTotal = 0;
  let weightSum = 0;
  sorted.forEach((checkin, index) => {
    const weight = index + 1;
    weightedTotal += calculateCheckinScore(checkin) * weight;
    weightSum += weight;
  });
  const score = Math.round(weightedTotal / weightSum);

  // Trend
  let trend: VelocityScore["trend"] = "stable";
  if (sorted.length >= 2) {
    const prev = calculateCheckinScore(sorted[sorted.length - 2]);
    const curr = calculateCheckinScore(latest);
    if (curr > prev + 10) trend = "improving";
    else if (curr < prev - 10) trend = "declining";
  }

  // Level
  let level: VelocityScore["level"];
  if (score >= 80) level = "thriving";
  else if (score >= 65) level = "stable";
  else if (score >= 50) level = "watch";
  else if (score >= 30) level = "at_risk";
  else level = "critical";

  // Risk factors
  const riskFactors: string[] = [];
  if (latest.mood <= 2) riskFactors.push("Low mood at latest check-in");
  if (latest.confidence != null && latest.confidence <= 2) riskFactors.push("Low confidence in role");
  if (latest.team_integration != null && latest.team_integration <= 2) riskFactors.push("Poor team integration");
  if (trend === "declining") riskFactors.push("Engagement trending downward");
  if (latest.day_number === 3 && latest.mood <= 2) riskFactors.push("⚡ Failed 72-hour velocity check");

  // Recommendations
  const recommendations: string[] = [];
  if (latest.mood <= 2) recommendations.push("Schedule 1-on-1 conversation within 24 hours");
  if (latest.confidence != null && latest.confidence <= 2) recommendations.push("Review training pace — may be overwhelming or under-stimulating");
  if (latest.team_integration != null && latest.team_integration <= 2) recommendations.push("Check buddy relationship — consider reassigning if needed");
  if (trend === "declining") recommendations.push("Identify what changed since last positive check-in");
  if (riskFactors.length === 0) recommendations.push("Keep doing what you're doing — this person is thriving");

  return { score, level, trend, riskFactors, recommendations };
}
