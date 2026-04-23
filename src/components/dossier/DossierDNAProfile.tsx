import { motion } from "framer-motion";
import { Brain, Briefcase, Building, MapPin, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  ARCHETYPE_META,
  DIMENSION_GROUPS,
  DIMENSION_LABELS,
  pickEqSuperpower,
  parseSectorMatches,
  parseDepartmentMatches,
  parseGeographyMatches,
} from "@/utils/dnaProfile";

interface Props {
  archetype?: string;
  archetypeName?: string;
  dimensions: Record<string, number>;
  sectorMatchesRaw: unknown;
  departmentMatchesRaw: unknown;
  geographyMatchesRaw: unknown;
  completedAt?: string | null;
}

export function DossierDNAProfile({
  archetype,
  archetypeName,
  dimensions,
  sectorMatchesRaw,
  departmentMatchesRaw,
  geographyMatchesRaw,
  completedAt,
}: Props) {
  const key = (archetype || "").toLowerCase();
  const meta = ARCHETYPE_META[key] ?? ARCHETYPE_META.lion;
  const eq = pickEqSuperpower(dimensions);
  const sectors = parseSectorMatches(sectorMatchesRaw).slice(0, 3);
  const departments = parseDepartmentMatches(departmentMatchesRaw).slice(0, 3);
  const geographies = parseGeographyMatches(geographyMatchesRaw).slice(0, 4);

  const dateLabel = completedAt
    ? new Date(completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="bg-card rounded-xl border border-border p-6 relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(500px at 0% 0%, ${meta.color}, transparent 70%)` }}
      />
      <div className="relative">
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
            style={{ background: `${meta.color}20`, border: `1px solid ${meta.color}40` }}
          >
            {meta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> DNA Profile
            </p>
            <h2 className="text-lg font-bold leading-tight">
              {archetypeName || meta.title} <span className="text-muted-foreground font-normal">— {meta.tagline}</span>
            </h2>
            {dateLabel && (
              <p className="text-xs text-muted-foreground mt-1">Assessed {dateLabel}</p>
            )}
          </div>
        </div>

        {eq && (
          <div className="mb-5 p-3 rounded-lg border border-border/40 bg-muted/30 flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">EQ Superpower</p>
              <p className="text-sm font-semibold">{eq.label}</p>
              <p className="text-xs text-muted-foreground">{eq.descriptor}</p>
            </div>
            <span className="text-2xl font-bold flex-shrink-0" style={{ color: meta.color }}>
              {Math.round(eq.score)}
            </span>
          </div>
        )}

        {Object.keys(dimensions).length > 0 && (
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 mb-5">
            {DIMENSION_GROUPS.map((group) => {
              const groupDims = group.keys
                .map((k) => ({ key: k, label: DIMENSION_LABELS[k] ?? k, score: dimensions[k] }))
                .filter((d) => typeof d.score === "number")
                .sort((a, b) => (b.score! - a.score!))
                .slice(0, 4);
              if (groupDims.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                    <span className="text-sm">{group.icon}</span> {group.label}
                  </p>
                  <div className="space-y-1.5">
                    {groupDims.map((d) => (
                      <div key={d.key}>
                        <div className="flex items-center justify-between mb-0.5 text-[11px]">
                          <span>{d.label}</span>
                          <span className="font-semibold" style={{ color: meta.color }}>{Math.round(d.score!)}</span>
                        </div>
                        <Progress value={d.score} className="h-1" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-3">
          {sectors.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                <Briefcase className="w-3 h-3" /> Top Sectors
              </p>
              <div className="space-y-1">
                {sectors.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30 border border-border/30">
                    <span className="truncate">{s.sector}</span>
                    {s.fitScore && <span className="font-semibold ml-2 flex-shrink-0">{s.fitScore}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {departments.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1.5 flex items-center gap-1">
                <Building className="w-3 h-3" /> Top Departments
              </p>
              <div className="space-y-1">
                {departments.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-muted/30 border border-border/30">
                    <span className="truncate">
                      {d.emoji && <span className="mr-1">{d.emoji}</span>}{d.department}
                    </span>
                    {d.fitScore && <span className="font-semibold ml-2 flex-shrink-0">{d.fitScore}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {geographies.length > 0 && (
          <div className="mt-4 flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>Geographic fit:</span>
            {geographies.map((g, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                {g.flag && <span>{g.flag}</span>}
                <span>{g.region}</span>
                {i < geographies.length - 1 && <span>·</span>}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
