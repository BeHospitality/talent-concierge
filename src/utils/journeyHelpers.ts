import { supabase } from "@/integrations/supabase/client";

// ─── Journey Progress ────────────────────────────────────────
export async function getJourneyProgress(candidateId: string) {
  const { data: journey } = await supabase
    .from("journey_blueprints")
    .select("*")
    .eq("candidate_id", candidateId)
    .single();

  if (!journey) return null;

  const { data: events } = await supabase
    .from("journey_events")
    .select("*")
    .eq("journey_id", journey.id)
    .order("scheduled_for", { ascending: true });

  const allEvents = events || [];
  const completed = allEvents.filter((e) => e.status === "completed").length;
  const total = allEvents.length;
  const overdue = allEvents.filter(
    (e) =>
      e.status === "pending" &&
      e.scheduled_for &&
      new Date(e.scheduled_for) < new Date()
  ).length;
  const upcoming = allEvents
    .filter(
      (e) =>
        (e.status === "pending" || e.status === "active") &&
        e.scheduled_for &&
        new Date(e.scheduled_for) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.scheduled_for!).getTime() -
        new Date(b.scheduled_for!).getTime()
    );

  return {
    journey,
    events: allEvents,
    progress: {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
    },
    overdue,
    nextEvent: upcoming[0] || null,
    currentPhase: journey.current_phase,
  };
}

// ─── Complete an Event ───────────────────────────────────────
export async function completeEvent(
  eventId: string,
  completedBy?: string,
  notes?: string
) {
  const updateData: Record<string, unknown> = {
    status: "completed",
    completed_at: new Date().toISOString(),
  };

  if (completedBy) updateData.completed_by = completedBy;
  if (notes) updateData.metadata = { notes };

  const { error } = await supabase
    .from("journey_events")
    .update(updateData)
    .eq("id", eventId);

  if (error) {
    console.error("Failed to complete event:", error);
    throw error;
  }
}

// ─── Get Overdue Events for an Organization ──────────────────
export async function getOrgOverdueEvents(organizationId: string) {
  const { data } = await supabase
    .from("journey_events")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("status", "pending")
    .lt("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true });

  return data || [];
}
