import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MOOD_EMOJIS, type EngagementCheckin } from "@/utils/velocityScoring";

interface EngagementChartProps {
  checkins: EngagementCheckin[];
}

const DAY_LABEL_MAP: Record<number, string> = {
  0: "D1", 1: "D1", 3: "D3", 7: "W1", 14: "W2",
  30: "D30", 45: "D45", 60: "D60", 90: "D90",
};

export function EngagementChart({ checkins }: EngagementChartProps) {
  if (checkins.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-border/50 p-6 text-center">
        <p className="text-sm text-muted-foreground">No check-in data yet to chart.</p>
      </div>
    );
  }

  const data = checkins.map((c) => ({
    day: DAY_LABEL_MAP[c.day_number] || `D${c.day_number}`,
    dayNum: c.day_number,
    mood: c.mood,
    confidence: c.confidence,
    team: c.team_integration,
  }));

  const hasConfidence = checkins.some((c) => c.confidence != null);
  const hasTeam = checkins.some((c) => c.team_integration != null);

  return (
    <div className="bg-card rounded-xl border border-border/50 p-5">
      <h3 className="text-sm font-semibold mb-4">Engagement Over Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
          <YAxis
            domain={[1, 5]}
            ticks={[1, 2, 3, 4, 5]}
            tickFormatter={(v: number) => MOOD_EMOJIS[v - 1] || String(v)}
            tick={{ fontSize: 14 }}
            stroke="hsl(var(--muted-foreground))"
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value: number, name: string) => {
              if (name === "mood") return [`${MOOD_EMOJIS[value - 1]} ${value}/5`, "Mood"];
              if (name === "confidence") return [`${value}/5`, "Confidence"];
              return [`${value}/5`, "Team"];
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="mood" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 5 }} name="Mood" />
          {hasConfidence && (
            <Line type="monotone" dataKey="confidence" stroke="hsl(var(--success))" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} name="Confidence" />
          )}
          {hasTeam && (
            <Line type="monotone" dataKey="team" stroke="hsl(var(--warning))" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} name="Team" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
