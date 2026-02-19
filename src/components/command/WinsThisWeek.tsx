import { Trophy } from "lucide-react";

interface Props {
  wins: string[];
}

export function WinsThisWeek({ wins }: Props) {
  if (wins.length === 0) return null;

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-success mb-3 flex items-center gap-2">
        <Trophy className="w-4 h-4" /> Wins This Week
      </h2>
      <div className="bg-success/5 border border-success/20 rounded-xl p-4 space-y-2">
        {wins.map((w, i) => (
          <p key={i} className="text-sm">{w}</p>
        ))}
      </div>
    </div>
  );
}
