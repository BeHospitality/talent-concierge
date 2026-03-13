// Maps raw dimension scores to hiring-manager-friendly narratives

export interface StrengthCard {
  icon: string;
  title: string;
  description: string;
  level: "very-high" | "high" | "moderate";
}

const DIMENSION_NARRATIVES: Record<string, { titles: string[]; descriptions: Record<string, string> }> = {
  autonomy: {
    titles: ["Self-Directed", "Takes Initiative", "Independent Operator"],
    descriptions: {
      high: "Thrives when given ownership and responsibility. Makes confident decisions without constant oversight — ideal for supervisory or solo-shift roles.",
      moderate: "Capable of working independently when needed, while also valuing team support and guidance.",
    },
  },
  collaboration: {
    titles: ["Team-Oriented", "Collaborative Leader", "Natural Team Player"],
    descriptions: {
      high: "Builds strong working relationships quickly. Naturally lifts team morale and coordinates well across departments.",
      moderate: "Works well within teams and contributes reliably to group goals.",
    },
  },
  precision: {
    titles: ["Detail-Oriented", "Quality-Focused", "Standards-Driven"],
    descriptions: {
      high: "Consistently delivers work to a high standard. Pays close attention to detail — excellent for roles where quality and consistency matter.",
      moderate: "Maintains good standards while balancing efficiency with thoroughness.",
    },
  },
  adaptability: {
    titles: ["Highly Adaptable", "Flexible & Resilient", "Change-Ready"],
    descriptions: {
      high: "Handles change and pressure with ease. Stays calm during peak periods and adjusts quickly to shifting priorities.",
      moderate: "Adapts to new situations when needed, performing best with some structure and routine.",
    },
  },
  leadership: {
    titles: ["Natural Leader", "Team-Oriented Leadership", "Born to Lead"],
    descriptions: {
      high: "Naturally guides and motivates others. Steps up in challenging situations and earns team respect quickly.",
      moderate: "Shows leadership potential, especially in familiar environments. Grows into leadership with experience.",
    },
  },
};

export function getTopStrengths(dimensions: Record<string, number>, count = 3): StrengthCard[] {
  const sorted = Object.entries(dimensions)
    .filter(([key]) => DIMENSION_NARRATIVES[key])
    .sort(([, a], [, b]) => b - a)
    .slice(0, count);

  const icons = ["⭐", "🤝", "💯", "🎯", "🔥"];

  return sorted.map(([key, score], i) => {
    const narrative = DIMENSION_NARRATIVES[key];
    const level: StrengthCard["level"] = score >= 80 ? "very-high" : score >= 60 ? "high" : "moderate";
    const descKey = score >= 65 ? "high" : "moderate";
    const titleIdx = Math.min(Math.floor(Math.random() * narrative.titles.length), narrative.titles.length - 1);

    return {
      icon: icons[i] || "✨",
      title: narrative.titles[titleIdx],
      description: narrative.descriptions[descKey],
      level,
    };
  });
}

export function getWorkingStyle(archetype: string | undefined, dimensions: Record<string, number>) {
  const autonomy = dimensions.autonomy || 0;
  const collaboration = dimensions.collaboration || 0;
  const adaptability = dimensions.adaptability || 0;
  const precision = dimensions.precision || 0;

  return {
    decisionMaking:
      archetype === "lion" || autonomy > 70
        ? "Prefers autonomy and ownership. Thrives when given responsibility and trusted to make calls independently."
        : collaboration > 70
        ? "Collaborative approach — values team input and consensus before acting."
        : "Balanced decision-maker who adapts their approach based on the situation.",
    teamDynamics:
      collaboration > 70
        ? "Highly collaborative. Builds strong team relationships and lifts group morale naturally."
        : autonomy > 70
        ? "Focused individual contributor who delivers independently. Works best with clear ownership of tasks."
        : "Flexible team member who balances solo work with collaboration as needed.",
    stressResponse:
      adaptability > 75
        ? "Remains calm under pressure. Handles peak periods, last-minute changes, and high-demand situations well."
        : adaptability > 55
        ? "Manages stress effectively with the right support. Performs best with some advance notice of changes."
        : "Performs best with structured routines and clear expectations. Benefits from predictable schedules.",
    qualityFocus:
      precision > 75
        ? "Consistently delivers to a high standard. Naturally attentive to detail and quality in their work."
        : precision > 55
        ? "Maintains good standards while balancing efficiency. Reliable and thorough in routine tasks."
        : "Results-oriented — focuses on getting things done. May benefit from quality checklists for detailed tasks.",
  };
}

export function getRetentionInsights(archetype: string | undefined, dimensions: Record<string, number>) {
  const factors: { text: string; type: "positive" | "warning" }[] = [];
  const autonomy = dimensions.autonomy || 0;
  const collaboration = dimensions.collaboration || 0;
  const leadership = dimensions.leadership || 0;
  const adaptability = dimensions.adaptability || 0;

  if (autonomy > 70) {
    factors.push({ text: "Given ownership of their area and trusted to problem-solve independently", type: "positive" });
    factors.push({ text: "May become disengaged if micromanaged or given limited autonomy", type: "warning" });
  }
  if (collaboration > 70) {
    factors.push({ text: "Part of a supportive, communicative team environment", type: "positive" });
  }
  if (leadership > 70) {
    factors.push({ text: "Provided with clear career progression and leadership opportunities", type: "positive" });
    factors.push({ text: "May seek new challenges if growth opportunities stall after 6–12 months", type: "warning" });
  }
  if (adaptability > 70) {
    factors.push({ text: "Engaged with variety and new challenges — avoids repetitive routines", type: "positive" });
  }

  // Always add some baseline positives
  if (factors.filter((f) => f.type === "positive").length < 2) {
    factors.unshift({ text: "Recognized for their contributions and given regular feedback", type: "positive" });
    factors.unshift({ text: "Provided with structured onboarding and clear role expectations", type: "positive" });
  }

  return factors;
}

export function getRoleFitNarrative(department: string | undefined, archetype: string | undefined, dimensions: Record<string, number>): string {
  const normalizedDepartment = (department || "hospitality").trim() || "hospitality";
  const autonomy = dimensions.autonomy || 0;
  const collaboration = dimensions.collaboration || 0;
  const leadership = dimensions.leadership || 0;
  const adaptability = dimensions.adaptability || 0;

  const traits: string[] = [];
  if (autonomy > 70) traits.push("independent problem-solving");
  if (collaboration > 70) traits.push("strong interpersonal skills");
  if (leadership > 70) traits.push("natural leadership ability");
  if (adaptability > 70) traits.push("adaptability to fast-paced environments");

  const traitStr = traits.length > 0 ? traits.slice(0, 2).join(" and ") : "their overall profile";

  return `Combines ${traitStr} — making this a strong fit for ${normalizedDepartment.toLowerCase()} roles.`;
}
