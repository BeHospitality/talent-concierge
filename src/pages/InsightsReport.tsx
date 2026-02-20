import { useParams, Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { BarChart3, Heart, Target, Lightbulb, Download, Calendar, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const BOOKING_URL = "https://calendar.app.google/jnoS2WB8um1GHo1S9";

function scoreColor(score: number): string {
  if (score >= 4) return "text-success";
  if (score >= 3) return "text-warning";
  return "text-destructive";
}

function scoreBarColor(score: number): string {
  if (score >= 4) return "bg-success";
  if (score >= 3) return "bg-warning";
  return "bg-destructive";
}

function riskBadge(level: string) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    healthy: { label: "✅ Healthy", variant: "default" },
    stable: { label: "🟢 Stable", variant: "default" },
    at_risk: { label: "🟡 At Risk", variant: "secondary" },
    critical: { label: "🔴 Critical", variant: "destructive" },
  };
  const info = map[level] || { label: level, variant: "secondary" as const };
  return <Badge variant={info.variant} className="text-xs">{info.label}</Badge>;
}

function Section({ icon: Icon, title, children, delay = 0 }: { icon: any; title: string; children: React.ReactNode; delay?: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold uppercase tracking-wider">{title}</h2>
      </div>
      <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl p-6">
        {children}
      </div>
    </motion.section>
  );
}

export default function InsightsReport() {
  const { accessCode } = useParams<{ accessCode: string }>();

  // Check session
  const session = (() => {
    try {
      const raw = localStorage.getItem(`insight_${accessCode}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // 24h expiry
      if (Date.now() - parsed.ts > 86400000) return null;
      return parsed;
    } catch { return null; }
  })();

  const { data: report, isLoading } = useQuery({
    queryKey: ["insight_report_view", accessCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_reports")
        .select("*")
        .eq("access_code", accessCode!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!accessCode && !!session,
  });

  if (!session) return <Navigate to={`/insights/${accessCode}`} replace />;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-radial flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-bold text-sm">B</span>
        </div>
      </div>
    );
  }

  if (!report) return <Navigate to={`/insights/${accessCode}`} replace />;

  const rd = (report.report_data || {}) as any;
  const audit = rd.audit;
  const vibe = rd.vibe_check;
  const analysis = rd.analysis;
  const recommendations = rd.recommendations || [];

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-gradient-radial">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50 print:hidden">
        <div className="flex items-center justify-between px-6 h-14 max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">B</span>
            </div>
            <span className="font-bold text-sm tracking-tight">be connect</span>
          </div>
          <Button size="sm" variant="outline" onClick={handlePrint} className="gap-2">
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold mb-1">{report.property_name}</h1>
          <p className="text-xl text-muted-foreground">Team Insight Report</p>
          <p className="text-sm text-muted-foreground mt-2">
            Prepared: {new Date(report.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}
            {" · "}For: {report.manager_name}
          </p>
        </motion.div>

        {/* The Numbers */}
        {audit && (
          <Section icon={BarChart3} title="The Numbers" delay={0.1}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Annual Turnover Cost</p>
                <p className="text-2xl font-bold text-destructive">€{(audit.annual_cost || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Daily Bleed</p>
                <p className="text-2xl font-bold text-destructive">-€{(audit.daily_bleed || 0).toLocaleString()}/day</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cost Per Departure</p>
                <p className="text-2xl font-bold">€{(audit.cost_per_departure || 0).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Departures / Year</p>
                <p className="text-2xl font-bold">{audit.departures_per_year || 0}</p>
              </div>
            </div>
            {audit.invisible_percent != null && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Invisible Cost</span>
                  <span className="text-sm font-bold text-warning">{audit.invisible_percent}%</span>
                </div>
                <div className="w-full h-3 rounded-full bg-muted/50 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-warning transition-all duration-1000"
                    style={{ width: `${audit.invisible_percent}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">of your turnover cost is invisible</p>
              </div>
            )}
          </Section>
        )}

        {/* The Vibe */}
        {vibe && (
          <Section icon={Heart} title="The Vibe" delay={0.2}>
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Team Health Score</p>
                <p className={`text-3xl font-bold ${scoreColor(vibe.overall_score)}`}>
                  {vibe.overall_score}/5
                </p>
              </div>
              <div>{riskBadge(vibe.risk_level)}</div>
              {vibe.response_count != null && (
                <div className="ml-auto text-right">
                  <p className="text-xs text-muted-foreground">Responses</p>
                  <p className="text-sm font-semibold">
                    {vibe.response_count} of {vibe.total_staff} ({vibe.response_rate}%)
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {(vibe.questions || []).map((q: any, i: number) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{q.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${scoreColor(q.avg)}`}>{q.avg}</span>
                      <span className="text-xs text-muted-foreground">{q.label}</span>
                    </div>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-muted/50 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${scoreBarColor(q.avg)}`}
                      style={{ width: `${(q.avg / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* What This Means */}
        {analysis && (
          <Section icon={Target} title="What This Means" delay={0.3}>
            <blockquote className="text-xl font-bold italic text-primary border-l-4 border-primary pl-4 mb-6">
              "{analysis.headline}"
            </blockquote>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">{analysis.summary}</p>

            <div className="grid md:grid-cols-2 gap-4">
              {analysis.weakest_area && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-destructive" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-destructive">Weakest</span>
                  </div>
                  <p className="font-bold">{analysis.weakest_area.name} ({analysis.weakest_area.score}/5)</p>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.weakest_area.insight}</p>
                </div>
              )}
              {analysis.strongest_area && (
                <div className="bg-success/5 border border-success/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-success" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-success">Strongest</span>
                  </div>
                  <p className="font-bold">{analysis.strongest_area.name} ({analysis.strongest_area.score}/5)</p>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.strongest_area.insight}</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <Section icon={Lightbulb} title="Recommended Actions" delay={0.4}>
            <div className="space-y-4">
              {recommendations.map((rec: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm font-bold text-primary">{i + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">{rec.title}</p>
                    {rec.description && <p className="text-sm text-muted-foreground mt-0.5">{rec.description}</p>}
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="text-[10px]">Impact: {rec.impact}</Badge>
                      <Badge variant="outline" className="text-[10px]">Effort: {rec.effort}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="border-t border-border/50 pt-10 mt-10 text-center print:hidden"
        >
          <h3 className="text-xl font-bold mb-2">Ready to discuss your results?</h3>
          <p className="text-sm text-muted-foreground mb-6">Book a 30-minute strategy session with the Be Connect team.</p>
          <div className="flex items-center justify-center gap-4">
            <Button asChild className="gap-2 gold-glow-hover">
              <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer">
                <Calendar className="w-4 h-4" />
                Book Strategy Session
              </a>
            </Button>
            <Button variant="outline" onClick={handlePrint} className="gap-2">
              <Download className="w-4 h-4" />
              Download PDF
            </Button>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-12 pb-8">
          <p className="text-xs text-muted-foreground">
            be connect · <a href="mailto:hello@be.ie" className="text-primary hover:underline">hello@be.ie</a> · Confidential
          </p>
        </div>
      </main>
    </div>
  );
}
