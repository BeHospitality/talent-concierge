import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Brain, Sparkles, MapPin, Briefcase, Building, Calendar, Star, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from "recharts";
import {
  parseDimensions,
  parseSectorMatches,
  parseDepartmentMatches,
  parseGeographyMatches,
  ARCHETYPE_META,
  DIMENSION_GROUPS,
  DIMENSION_LABELS,
  pickEqSuperpower,
} from "@/utils/dnaProfile";

interface Props {
  candidateId: string;
  isDemoMode?: boolean;
}

export function DNAProfileSection({ candidateId, isDemoMode }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["dna_profile", candidateId],
    enabled: !isDemoMode && !!candidateId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prescreening_data")
        .select("archetype_type, tribe_viral_archetype, tribe_viral_scores, dimension_scores, matching_results, sector_matches, department_matches, geography_matches, completed_at, dna_path, candidate_tier")
        .eq("candidate_id", candidateId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (isDemoMode) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <Brain className="w-10 h-10 text-primary/40 mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">DNA Profile</h2>
        <p className="text-sm text-muted-foreground">Switch off Demo Mode to view real DNA assessment data.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  const archetypeKey = (data?.tribe_viral_archetype || "").toString().toLowerCase();
  const dimensions = parseDimensions(data?.dimension_scores);
  const sectorMatches = parseSectorMatches(data?.sector_matches);
  const departmentMatches = parseDepartmentMatches(data?.department_matches);
  const geographyMatches = parseGeographyMatches(data?.geography_matches);

  if (!data || (!archetypeKey && Object.keys(dimensions).length === 0)) {
    return (
      <div className="bg-card rounded-xl border border-border p-8 text-center">
        <AlertCircle className="w-10 h-10 text-muted-foreground/60 mx-auto mb-3" />
        <h2 className="text-lg font-semibold mb-1">No DNA Assessment Data</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          This candidate has not completed the DNA Assessment yet, or the results have not arrived from connect.be.ie.
        </p>
      </div>
    );
  }

  const archetypeMeta = ARCHETYPE_META[archetypeKey] ?? ARCHETYPE_META.lion;
  const archetypeName = data?.archetype_type || archetypeMeta.title;

  // Five primary dimensions for the radar
  const primaryDims = ["adaptability", "collaboration", "leadership", "precision", "autonomy"];
  const radarData = primaryDims.map((k) => ({
    dimension: DIMENSION_LABELS[k] ?? k,
    value: typeof dimensions[k] === "number" ? dimensions[k] : 0,
  }));

  const completedAt = data?.completed_at
    ? new Date(data.completed_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;

  const eqSuperpower = pickEqSuperpower(dimensions);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ background: `radial-gradient(600px at 0% 0%, ${archetypeMeta.color}, transparent 70%)` }}
        />
        <div className="flex items-start gap-5 relative">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl flex-shrink-0"
            style={{ background: `${archetypeMeta.color}20`, border: `1px solid ${archetypeMeta.color}40` }}
          >
            {archetypeMeta.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Brain className="w-3 h-3" /> DNA Archetype
            </p>
            <h2 className="text-2xl font-bold leading-tight">
              {archetypeName} <span className="text-muted-foreground font-normal text-lg">— {archetypeMeta.tagline}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              {data?.candidate_tier && (
                <Badge variant="secondary" className="text-xs">{data.candidate_tier}</Badge>
              )}
              {data?.dna_path && (
                <Badge variant="outline" className="text-xs capitalize">{data.dna_path} Path</Badge>
              )}
              {completedAt && (
                <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Assessed {completedAt}
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* RADAR + EQ SUPERPOWER */}
      <div className="grid md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-xl border border-border p-5 md:col-span-2"
        >
          <h3 className="text-sm font-semibold mb-1">Five Primary Dimensions</h3>
          <p className="text-xs text-muted-foreground mb-3">The core profile of this candidate's working style.</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke={archetypeMeta.color}
                  fill={archetypeMeta.color}
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {eqSuperpower && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-5 flex flex-col"
          >
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-primary" /> EQ Superpower
            </p>
            <h3 className="text-xl font-bold mt-1 mb-1">{eqSuperpower.label}</h3>
            <p className="text-xs text-muted-foreground flex-1">{eqSuperpower.descriptor}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Score</span>
              <span className="text-2xl font-bold" style={{ color: archetypeMeta.color }}>
                {Math.round(eqSuperpower.score)}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* 23 DIMENSIONS GROUPED */}
      {Object.keys(dimensions).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <h3 className="text-sm font-semibold mb-3">Full Dimensional Profile</h3>
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-5">
            {DIMENSION_GROUPS.map((group) => {
              const groupDims = group.keys
                .map((k) => ({ key: k, label: DIMENSION_LABELS[k] ?? k, score: dimensions[k] }))
                .filter((d) => typeof d.score === "number");
              if (groupDims.length === 0) return null;
              return (
                <div key={group.label}>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
                    <span className="text-base">{group.icon}</span> {group.label}
                  </p>
                  <div className="space-y-2">
                    {groupDims.map((d) => (
                      <div key={d.key}>
                        <div className="flex items-center justify-between mb-0.5 text-xs">
                          <span className="text-foreground">{d.label}</span>
                          <span className="font-semibold" style={{ color: archetypeMeta.color }}>{Math.round(d.score!)}</span>
                        </div>
                        <Progress value={d.score} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* MATCHES */}
      <div className="grid md:grid-cols-2 gap-4">
        {sectorMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-primary" /> Top Sector Matches
            </h3>
            <div className="space-y-2">
              {sectorMatches.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.sector}</p>
                    {s.description && (
                      <p className="text-[11px] text-muted-foreground truncate">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-sm font-bold">{s.fitScore ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {departmentMatches.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-card rounded-xl border border-border p-5"
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <Building className="w-4 h-4 text-primary" /> Top Department Matches
            </h3>
            <div className="space-y-2">
              {departmentMatches.slice(0, 3).map((d, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/30">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {d.emoji && <span className="mr-1.5">{d.emoji}</span>}
                      {d.department}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    <span className="text-sm font-bold">{d.fitScore ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* GEOGRAPHY */}
      {geographyMatches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl border border-border p-5"
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-primary" /> Geographic Fit
          </h3>
          <div className="flex flex-wrap gap-2">
            {geographyMatches.slice(0, 6).map((g, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40">
                {g.flag && <span className="text-base">{g.flag}</span>}
                <span className="text-xs font-medium">{g.region}</span>
                {g.fitScore && (
                  <span className="text-xs text-muted-foreground">· {g.fitScore}</span>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
