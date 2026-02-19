import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfToday, startOfWeek, isToday, isAfter } from "date-fns";

export interface JourneyWithDetails {
  id: string;
  candidate_id: string | null;
  organization_id: string | null;
  status: string;
  current_phase: string;
  start_date: string | null;
  offer_date: string | null;
  start_work_date: string | null;
  day_90_date: string | null;
  assigned_buddy_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  candidates: {
    id: string;
    full_name: string;
    email: string;
    photo_url: string | null;
  } | null;
  journey_events: JourneyEvent[];
}

export interface JourneyEvent {
  id: string;
  journey_id: string | null;
  phase: string;
  event_type: string;
  title: string;
  description: string | null;
  day_offset: number | null;
  scheduled_for: string | null;
  completed_at: string | null;
  completed_by: string | null;
  status: string;
  assigned_to: string | null;
  priority: string | null;
  metadata: Record<string, unknown> | null;
}

export interface AttentionEvent extends JourneyEvent {
  candidate: JourneyWithDetails["candidates"];
  journey_phase: string;
  days_overdue: number;
}

export function useJourneyDashboard() {
  const { data: activeJourneys, isLoading: loadingActive, refetch: refetchActive } = useQuery({
    queryKey: ["journeys", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_blueprints")
        .select(`
          *,
          candidates (id, full_name, email, photo_url),
          journey_events (*)
        `)
        .eq("status", "active")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as JourneyWithDetails[];
    },
    refetchInterval: 30000,
  });

  const { data: completedJourneys, isLoading: loadingCompleted } = useQuery({
    queryKey: ["journeys", "completed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journey_blueprints")
        .select(`
          *,
          candidates (id, full_name, email, photo_url)
        `)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as unknown as JourneyWithDetails[];
    },
  });

  const today = startOfToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });

  const allEvents: AttentionEvent[] = (activeJourneys || []).flatMap((j) =>
    j.journey_events.map((e) => {
      const scheduledDate = e.scheduled_for ? new Date(e.scheduled_for) : null;
      const daysOverdue = scheduledDate && scheduledDate < today
        ? Math.floor((today.getTime() - scheduledDate.getTime()) / 86400000)
        : 0;
      return {
        ...e,
        candidate: j.candidates,
        journey_phase: j.current_phase,
        days_overdue: daysOverdue,
      };
    })
  );

  const overdueEvents = allEvents
    .filter((e) => e.status === "pending" && e.scheduled_for && new Date(e.scheduled_for) < today)
    .sort((a, b) => b.days_overdue - a.days_overdue);

  const dueTodayEvents = allEvents
    .filter((e) => e.status === "pending" && e.scheduled_for && isToday(new Date(e.scheduled_for)))
    .sort((a, b) => {
      const prio = { urgent: 0, high: 1, normal: 2 };
      return (prio[(a.priority || "normal") as keyof typeof prio] ?? 2) -
        (prio[(b.priority || "normal") as keyof typeof prio] ?? 2);
    });

  const completedThisWeek = allEvents.filter(
    (e) => e.status === "completed" && e.completed_at && isAfter(new Date(e.completed_at), weekStart)
  );

  return {
    activeJourneys: activeJourneys || [],
    completedJourneys: completedJourneys || [],
    stats: {
      overdue: overdueEvents.length,
      dueToday: dueTodayEvents.length,
      completedThisWeek: completedThisWeek.length,
      graduated: completedJourneys?.length || 0,
    },
    overdueEvents,
    dueTodayEvents,
    isLoading: loadingActive || loadingCompleted,
    refetch: refetchActive,
  };
}
