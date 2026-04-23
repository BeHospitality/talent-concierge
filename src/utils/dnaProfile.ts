// Shared parsing + presentation helpers for DNA assessment data.
// Handles the fact that match arrays may be stored as JSON-stringified
// objects in text[] columns, and dimensions live either at the column
// level or nested inside matching_results.comprehensiveScores.

export interface SectorMatch {
  sector: string;
  fitScore?: number;
  description?: string;
  topStrengths?: string[];
  stars?: number;
}

export interface DepartmentMatch {
  department: string;
  fitScore?: number;
  emoji?: string;
  topReasons?: string[];
  rank?: number;
}

export interface GeographyMatch {
  region: string;
  fitScore?: number;
  flag?: string;
  reason?: string;
  fit?: string;
}

export const ARCHETYPE_META: Record<string, { emoji: string; color: string; title: string; tagline: string }> = {
  lion: {
    emoji: "🦁",
    color: "hsl(38, 92%, 55%)",
    title: "Lion",
    tagline: "The Decisive Leader",
  },
  whale: {
    emoji: "🐋",
    color: "hsl(210, 70%, 55%)",
    title: "Whale",
    tagline: "The Collaborative Anchor",
  },
  falcon: {
    emoji: "🦅",
    color: "hsl(270, 60%, 60%)",
    title: "Falcon",
    tagline: "The Visionary Adapter",
  },
};

export const DIMENSION_LABELS: Record<string, string> = {
  // Cognitive
  problemSolving: "Problem Solving",
  patternRecognition: "Pattern Recognition",
  learningSpeed: "Learning Speed",
  concentration: "Concentration",
  attentionToDetail: "Attention to Detail",
  // EQ
  empathy: "Empathy",
  socialAwareness: "Social Awareness",
  readingOthers: "Reading Others",
  selfRegulation: "Self-Regulation",
  emotionalStability: "Emotional Stability",
  // Work Style
  adaptability: "Adaptability",
  collaboration: "Collaboration",
  leadership: "Leadership",
  precision: "Precision",
  autonomy: "Autonomy",
  extraversion: "Extraversion",
  openness: "Openness",
  conscientiousness: "Conscientiousness",
  agreeableness: "Agreeableness",
  // Values
  integrity: "Integrity",
  dependability: "Dependability",
  ruleFollowing: "Rule Following",
  safetyConsciousness: "Safety Consciousness",
};

export const DIMENSION_GROUPS: { label: string; icon: string; keys: string[] }[] = [
  {
    label: "Cognitive",
    icon: "🧠",
    keys: ["problemSolving", "patternRecognition", "learningSpeed", "concentration", "attentionToDetail"],
  },
  {
    label: "Emotional Intelligence",
    icon: "❤️",
    keys: ["empathy", "socialAwareness", "readingOthers", "selfRegulation", "emotionalStability"],
  },
  {
    label: "Work Style",
    icon: "⚡",
    keys: ["adaptability", "collaboration", "leadership", "precision", "autonomy", "extraversion", "openness", "conscientiousness", "agreeableness"],
  },
  {
    label: "Values & Reliability",
    icon: "🛡️",
    keys: ["integrity", "dependability", "ruleFollowing", "safetyConsciousness"],
  },
];

const EQ_KEYS = ["empathy", "socialAwareness", "readingOthers", "selfRegulation", "emotionalStability"];

const EQ_DESCRIPTORS: Record<string, string> = {
  empathy: "Naturally tuned in to how others are feeling, even before they say so.",
  socialAwareness: "Reads the room with ease — picks up on team dynamics and mood shifts.",
  readingOthers: "Quickly understands intent and unspoken motivation in conversation.",
  selfRegulation: "Stays composed under pressure and manages personal reactions calmly.",
  emotionalStability: "A steady presence — keeps things grounded when others get rattled.",
};

export function parseDimensions(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const obj = value as Record<string, unknown>;
  const result: Record<string, number> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === "number" && Number.isFinite(v)) result[k] = v;
  }
  return result;
}

function tryParseRow<T>(item: unknown): T | null {
  if (typeof item === "string") {
    try {
      const parsed = JSON.parse(item);
      if (parsed && typeof parsed === "object") return parsed as T;
    } catch {
      return null;
    }
  }
  if (item && typeof item === "object") return item as T;
  return null;
}

export function parseSectorMatches(raw: unknown): SectorMatch[] {
  if (!Array.isArray(raw)) return [];
  const out: SectorMatch[] = [];
  raw.forEach((item) => {
    const row = tryParseRow<Record<string, unknown>>(item);
    if (row && typeof row.sector === "string") {
      out.push({
        sector: row.sector,
        fitScore: typeof row.fitScore === "number" ? row.fitScore : undefined,
        description: typeof row.description === "string" ? row.description : undefined,
        stars: typeof row.stars === "number" ? row.stars : undefined,
        topStrengths: Array.isArray(row.topStrengths) ? (row.topStrengths as string[]) : undefined,
      });
    } else if (typeof item === "string" && item.trim()) {
      out.push({ sector: item.trim() });
    }
  });
  return out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}

export function parseDepartmentMatches(raw: unknown): DepartmentMatch[] {
  if (!Array.isArray(raw)) return [];
  const out: DepartmentMatch[] = [];
  raw.forEach((item) => {
    const row = tryParseRow<Record<string, unknown>>(item);
    if (row && typeof row.department === "string") {
      out.push({
        department: row.department,
        fitScore: typeof row.fitScore === "number" ? row.fitScore : undefined,
        emoji: typeof row.emoji === "string" ? row.emoji : undefined,
        rank: typeof row.rank === "number" ? row.rank : undefined,
        topReasons: Array.isArray(row.topReasons) ? (row.topReasons as string[]) : undefined,
      });
    } else if (typeof item === "string" && item.trim()) {
      out.push({ department: item.trim() });
    }
  });
  return out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}

export function parseGeographyMatches(raw: unknown): GeographyMatch[] {
  if (!Array.isArray(raw)) return [];
  const out: GeographyMatch[] = [];
  raw.forEach((item) => {
    const row = tryParseRow<Record<string, unknown>>(item);
    if (row && typeof row.region === "string") {
      out.push({
        region: row.region,
        fitScore: typeof row.fitScore === "number" ? row.fitScore : undefined,
        flag: typeof row.flag === "string" ? row.flag : undefined,
        reason: typeof row.reason === "string" ? row.reason : undefined,
        fit: typeof row.fit === "string" ? row.fit : undefined,
      });
    } else if (typeof item === "string" && item.trim()) {
      out.push({ region: item.trim() });
    }
  });
  return out.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
}

export function pickEqSuperpower(dims: Record<string, number>): { key: string; label: string; descriptor: string; score: number } | null {
  let best: { key: string; score: number } | null = null;
  for (const k of EQ_KEYS) {
    const v = dims[k];
    if (typeof v === "number" && (!best || v > best.score)) best = { key: k, score: v };
  }
  if (!best) return null;
  return {
    key: best.key,
    label: DIMENSION_LABELS[best.key] ?? best.key,
    descriptor: EQ_DESCRIPTORS[best.key] ?? "",
    score: best.score,
  };
}
