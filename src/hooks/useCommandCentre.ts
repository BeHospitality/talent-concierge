import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateVelocity, type EngagementCheckin, type VelocityScore } from "@/utils/velocityScoring";
import { predictChurn, type ChurnPrediction } from "@/utils/churnPrediction";
import { startOfWeek, startOfMonth, isThisWeek, isAfter, isToday } from "date-fns";

export interface CommandJourney {
  id: string;
  candidate_id: string | null;
  organization_id: string | null;
  status: string;
  current_phase: string;
  start_date: string | null;
  start_work_date: string | null;
  day_90_date: string | null;
  created_at: string | null;
  updated_at: string | null;
  candidates: {
    id: string;
    full_name: string;
    email: string;
    photo_url: string | null;
  } | null;
  organizations: {
    id: string;
    organization_name: string;
    contact_name: string;
    contact_email: string;
    contact_phone: string | null;
  } | null;
  journey_events: {
    id: string;
    status: string;
    scheduled_for: string | null;
    priority: string | null;
    title: string;
    phase: string;
    completed_at: string | null;
  }[];
}

export interface CandidateVelocity {
  journey: CommandJourney;
  velocity: VelocityScore;
  churnPrediction: ChurnPrediction | null;
  checkins: EngagementCheckin[];
  latestCheckin: EngagementCheckin | null;
  journeyDay: number;
}

export interface PropertyStats {
  orgId: string;
  orgName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  activeJourneys: number;
  atRisk: number;
  avgChurnRisk: number;
  seventyTwoHrSuccess: number;
  ninetyDayRetention: number;
  overdueEvents: number;
  lastActivity: string | null;
}

export interface Intervention {
  id: string;
  organization_id: string | null;
  candidate_id: string;
  journey_id: string | null;
  intervention_type: string;
  summary: string;
  outcome: string | null;
  follow_up_date: string | null;
  logged_by: string;
  created_at: string;
}

export function useCommandCentre() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);

  // Fetch ALL active journeys (cross-org)
  const { data: journeys = [], isLoading: loadingJourneys, refetch: refetchJourneys } = useQuery({
    queryKey: ["command_journeys"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_blueprints")
        .select(`
          id, candidate_id, organization_id, status, current_phase,
          start_date, start_work_date, day_90_date, created_at, updated_at,
          candidates (id, full_name, email, photo_url),
          organizations (id, organization_name, contact_name, contact_email, contact_phone),
          journey_events (id, status, scheduled_for, priority, title, phase, completed_at)
        `)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CommandJourney[];
    },
    refetchInterval: 60000,
  });

  // Fetch ALL recent check-ins (last 90 days)
  const { data: allCheckins = [], isLoading: loadingCheckins } = useQuery({
    queryKey: ["command_checkins"],
    queryFn: async () => {
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      const { data, error } = await supabase
        .from("engagement_checkins")
        .select("*")
        .gte("created_at", ninetyDaysAgo.toISOString())
        .order("day_number", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as EngagementCheckin[];
    },
    refetchInterval: 60000,
  });

  // Fetch completed journeys
  const { data: completedJourneys = [] } = useQuery({
    queryKey: ["command_completed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_blueprints")
        .select(`
          id, candidate_id, organization_id, status, current_phase,
          start_date, day_90_date, updated_at,
          candidates (id, full_name, email, photo_url),
          organizations (id, organization_name, contact_name, contact_email, contact_phone)
        `)
        .eq("status", "completed")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as CommandJourney[];
    },
    refetchInterval: 60000,
  });

  // Fetch interventions
  const { data: interventions = [], refetch: refetchInterventions } = useQuery({
    queryKey: ["command_interventions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interventions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Intervention[];
    },
    refetchInterval: 60000,
  });

  const activeJourneys = journeys.filter((j) => j.status === "active");

  // Calculate velocity for each active journey
  const candidateVelocities: CandidateVelocity[] = activeJourneys.map((j) => {
    const checkins = allCheckins
      .filter((c) => c.candidate_id === j.candidate_id)
      .sort((a, b) => a.day_number - b.day_number);
    const velocity = calculateVelocity(checkins);
    const latestCheckin = checkins.length > 0 ? checkins[checkins.length - 1] : null;
    const startDate = j.start_work_date || j.start_date;
    const journeyDay = startDate
      ? Math.floor((today.getTime() - new Date(startDate).getTime()) / 86400000)
      : 0;

    // Calculate churn prediction inline
    const events = (j.journey_events || []).map((e) => ({
      status: e.status,
      scheduled_for: e.scheduled_for,
    }));
    const churnPrediction = checkins.length > 0
      ? predictChurn(checkins, { start_work_date: j.start_work_date, start_date: j.start_date }, events, null, null)
      : null;

    return { journey: j, velocity, churnPrediction, checkins, latestCheckin, journeyDay };
  });

  // Stats
  const urgent = candidateVelocities.filter(
    (cv) => cv.velocity.score < 30 || (cv.latestCheckin?.day_number === 3 && cv.latestCheckin?.mood <= 2)
  );
  const monitoring = candidateVelocities.filter(
    (cv) => cv.velocity.score >= 30 && cv.velocity.score < 50
  );
  const healthy = candidateVelocities.filter((cv) => cv.velocity.score >= 65);
  const graduatedThisMonth = completedJourneys.filter(
    (j) => j.updated_at && isAfter(new Date(j.updated_at), monthStart)
  );

  // Wins this week
  const wins: string[] = [];
  // Day 90 completions
  completedJourneys
    .filter((j) => j.updated_at && isThisWeek(new Date(j.updated_at), { weekStartsOn: 1 }))
    .forEach((j) => {
      wins.push(`🎉 ${j.organizations?.organization_name || "Unknown"} — ${j.candidates?.full_name} passed Day 90!`);
    });
  // Properties with 100% positive check-ins
  const orgGroups = new Map<string, EngagementCheckin[]>();
  allCheckins
    .filter((c) => c.created_at && isThisWeek(new Date(c.created_at), { weekStartsOn: 1 }))
    .forEach((c) => {
      const orgId = c.organization_id || "unknown";
      if (!orgGroups.has(orgId)) orgGroups.set(orgId, []);
      orgGroups.get(orgId)!.push(c);
    });
  // Velocity improving
  candidateVelocities
    .filter((cv) => cv.velocity.trend === "improving" && cv.velocity.level === "stable")
    .forEach((cv) => {
      wins.push(`🎉 ${cv.journey.organizations?.organization_name || "Unknown"} — ${cv.journey.candidates?.full_name} velocity improving`);
    });

  // Pattern detection for monitoring
  const patterns: { orgId: string; orgName: string; count: number; description: string }[] = [];
  const byOrg = new Map<string, CandidateVelocity[]>();
  candidateVelocities.forEach((cv) => {
    const orgId = cv.journey.organization_id || "none";
    if (!byOrg.has(orgId)) byOrg.set(orgId, []);
    byOrg.get(orgId)!.push(cv);
  });
  byOrg.forEach((cvs, orgId) => {
    const lowMood = cvs.filter((cv) => cv.latestCheckin && cv.latestCheckin.mood <= 3);
    if (lowMood.length >= 2) {
      const orgName = cvs[0]?.journey.organizations?.organization_name || "Unknown";
      patterns.push({
        orgId,
        orgName,
        count: lowMood.length,
        description: `${lowMood.length} new hires showing 😐 or lower`,
      });
    }
  });

  // Portfolio table stats
  const propertyStats: PropertyStats[] = [];
  const orgSet = new Map<string, CommandJourney[]>();
  [...activeJourneys, ...completedJourneys].forEach((j) => {
    const orgId = j.organization_id || "none";
    if (!orgSet.has(orgId)) orgSet.set(orgId, []);
    orgSet.get(orgId)!.push(j);
  });
  orgSet.forEach((orgJourneys, orgId) => {
    const org = orgJourneys[0]?.organizations;
    const active = orgJourneys.filter((j) => j.status === "active");
    const completed = orgJourneys.filter((j) => j.status === "completed");
    const orgCheckins = allCheckins.filter((c) => c.organization_id === orgId);
    const day3Checkins = orgCheckins.filter((c) => c.day_number === 3);
    const day3Success = day3Checkins.length > 0
      ? Math.round((day3Checkins.filter((c) => c.mood >= 3).length / day3Checkins.length) * 100)
      : 0;
    const totalPast90 = orgJourneys.filter(
      (j) => j.day_90_date && new Date(j.day_90_date) < today
    ).length;
    const retention = totalPast90 > 0
      ? Math.round((completed.length / totalPast90) * 100)
      : 0;
    const overdueEvents = active
      .flatMap((j) => j.journey_events || [])
      .filter((e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < today).length;
    const lastActivity = orgCheckins.length > 0
      ? orgCheckins.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
      : null;

    // Velocity per candidate
    const atRiskCount = active.filter((j) => {
      const cv = candidateVelocities.find((c) => c.journey.id === j.id);
      return cv && cv.velocity.score < 50;
    }).length;

    // Average churn risk for this org
    const orgChurnPredictions = active
      .map((j) => candidateVelocities.find((c) => c.journey.id === j.id)?.churnPrediction)
      .filter((p): p is ChurnPrediction => !!p);
    const avgChurnRisk = orgChurnPredictions.length > 0
      ? Math.round(orgChurnPredictions.reduce((sum, p) => sum + p.probability, 0) / orgChurnPredictions.length)
      : 0;

    propertyStats.push({
      orgId,
      orgName: org?.organization_name || "Unknown",
      contactName: org?.contact_name || "",
      contactEmail: org?.contact_email || "",
      contactPhone: org?.contact_phone || null,
      activeJourneys: active.length,
      atRisk: atRiskCount,
      avgChurnRisk,
      seventyTwoHrSuccess: day3Success,
      ninetyDayRetention: retention,
      overdueEvents,
      lastActivity,
    });
  });

  // Follow-ups
  const upcomingFollowUps = interventions.filter(
    (i) => i.follow_up_date && new Date(i.follow_up_date) >= today
  );

  const refetch = () => {
    refetchJourneys();
    refetchInterventions();
  };

  return {
    stats: {
      urgent: urgent.length,
      monitoring: monitoring.length,
      healthy: healthy.length,
      graduated: graduatedThisMonth.length,
    },
    urgentCandidates: urgent,
    monitoringCandidates: monitoring,
    wins,
    patterns,
    propertyStats,
    interventions,
    upcomingFollowUps,
    totalActive: activeJourneys.length,
    totalProperties: propertyStats.length,
    isLoading: loadingJourneys || loadingCheckins,
    refetch,
  };
}
