import { supabase } from "@/integrations/supabase/client";
import { addDays } from "date-fns";

// ─── Journey Event Template ──────────────────────────────────
export interface JourneyEventTemplate {
  phase: string;
  eventType: string;
  title: string;
  description: string;
  dayOffset: number | null;
  assignedTo: string;
  priority: string;
}

export const JOURNEY_TEMPLATE: JourneyEventTemplate[] = [
  // ═══════════════════════════════════════
  // PHASE 1: SCREENING (triggered on DNA arrival)
  // ═══════════════════════════════════════
  {
    phase: "screening",
    eventType: "auto",
    title: "DNA profile received",
    description: "Candidate completed DNA assessment. Archetype, scores, and matching data available.",
    dayOffset: 0,
    assignedTo: "system",
    priority: "normal",
  },
  {
    phase: "screening",
    eventType: "task",
    title: "Review DNA profile",
    description: "Review candidate archetype, dimension scores, sector match, and department fit. Check placement risk.",
    dayOffset: 0,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "screening",
    eventType: "task",
    title: "Check buddy compatibility",
    description: "Review suggested buddy matches. Consider archetype balance and department alignment.",
    dayOffset: 1,
    assignedTo: "manager",
    priority: "normal",
  },
  {
    phase: "screening",
    eventType: "milestone",
    title: "Decision: Proceed to interview or decline",
    description: "Based on DNA profile, placement risk, and team composition — invite to interview or pass.",
    dayOffset: 3,
    assignedTo: "manager",
    priority: "high",
  },

  // ═══════════════════════════════════════
  // PHASE 2: INTERVIEW
  // ═══════════════════════════════════════
  {
    phase: "interview",
    eventType: "auto",
    title: "Moved to interview stage",
    description: "Candidate progressed from screening to interview.",
    dayOffset: 0,
    assignedTo: "system",
    priority: "normal",
  },
  {
    phase: "interview",
    eventType: "task",
    title: "Schedule interview",
    description: "Book interview slot. Consider using DNA insights to tailor interview questions to candidate archetype.",
    dayOffset: 0,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "interview",
    eventType: "task",
    title: "Prepare DNA-informed interview questions",
    description: "Lion: Ask about leadership scenarios. Whale: Ask about team collaboration. Falcon: Ask about precision tasks.",
    dayOffset: 1,
    assignedTo: "manager",
    priority: "normal",
  },
  {
    phase: "interview",
    eventType: "check_in",
    title: "Post-interview assessment",
    description: "Record interview impressions. Does in-person align with DNA profile? Any red flags?",
    dayOffset: 3,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "interview",
    eventType: "milestone",
    title: "Decision: Offer, second interview, or decline",
    description: "Combine DNA insights + interview impressions to decide next step.",
    dayOffset: 5,
    assignedTo: "manager",
    priority: "high",
  },

  // ═══════════════════════════════════════
  // PHASE 3: OFFER
  // ═══════════════════════════════════════
  {
    phase: "offer",
    eventType: "auto",
    title: "Offer extended",
    description: "Candidate received offer. Pre-arrival journey will activate on acceptance.",
    dayOffset: 0,
    assignedTo: "system",
    priority: "normal",
  },
  {
    phase: "offer",
    eventType: "task",
    title: "Prepare offer details",
    description: "Role, salary, start date, reporting line, uniform requirements.",
    dayOffset: 0,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "offer",
    eventType: "task",
    title: "Assign buddy",
    description: "Select and confirm buddy from suggested matches. Notify buddy of upcoming new team member.",
    dayOffset: 1,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "offer",
    eventType: "milestone",
    title: "Offer accepted or declined",
    description: "If accepted → journey moves to pre-arrival. If declined → journey closes.",
    dayOffset: 3,
    assignedTo: "manager",
    priority: "urgent",
  },

  // ═══════════════════════════════════════
  // PHASE 4: PRE-ARRIVAL (Day -7 to Day 0)
  // ═══════════════════════════════════════
  {
    phase: "pre_arrival",
    eventType: "auto",
    title: "Pre-arrival journey activated",
    description: "Offer accepted. Countdown to first day begins.",
    dayOffset: 0,
    assignedTo: "system",
    priority: "normal",
  },
  {
    phase: "pre_arrival",
    eventType: "task",
    title: "Send welcome message",
    description: "Personal welcome from manager. Include: what to expect on Day 1, who their buddy is, dress code, arrival time.",
    dayOffset: -7,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "pre_arrival",
    eventType: "task",
    title: "Buddy introduction",
    description: 'Connect buddy with new hire. Buddy sends informal welcome — "Looking forward to working with you!"',
    dayOffset: -5,
    assignedTo: "buddy",
    priority: "high",
  },
  {
    phase: "pre_arrival",
    eventType: "check_in",
    title: "Pre-arrival check-in",
    description: 'Quick message to new hire: "How are you feeling about starting? Any questions?"',
    dayOffset: -3,
    assignedTo: "manager",
    priority: "normal",
  },
  {
    phase: "pre_arrival",
    eventType: "task",
    title: "Prepare workstation & materials",
    description: "Uniform ready, locker assigned, training schedule printed, Breaking of Bread gift prepared.",
    dayOffset: -2,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "pre_arrival",
    eventType: "task",
    title: "Final prep message",
    description: "Confirm arrival time, parking, who to ask for at reception. Remove any first-day anxiety.",
    dayOffset: -1,
    assignedTo: "manager",
    priority: "high",
  },

  // ═══════════════════════════════════════
  // PHASE 5: ONBOARDING (Day 1 to Day 30)
  // ═══════════════════════════════════════
  {
    phase: "onboarding",
    eventType: "milestone",
    title: "🍞 Day 1: Breaking of Bread",
    description: "First day. Welcome gift, team introduction, buddy lunch, manager 1-on-1 at end of day.",
    dayOffset: 0,
    assignedTo: "manager",
    priority: "urgent",
  },
  {
    phase: "onboarding",
    eventType: "check_in",
    title: "Day 1 evening: How was your first day?",
    description: "Quick check-in. Record their energy level (😊😐😟). Flag any concerns immediately.",
    dayOffset: 0,
    assignedTo: "buddy",
    priority: "high",
  },
  {
    phase: "onboarding",
    eventType: "check_in",
    title: "Day 3: 72-hour velocity check",
    description: "Critical checkpoint. Research shows 72 hours predicts 90-day retention. Record: engagement, confidence, team integration.",
    dayOffset: 3,
    assignedTo: "manager",
    priority: "urgent",
  },
  {
    phase: "onboarding",
    eventType: "alert",
    title: "Day 3: Velocity assessment",
    description: "If 72-hour check shows 😟 → immediate intervention. Schedule support conversation within 24 hours.",
    dayOffset: 3,
    assignedTo: "system",
    priority: "urgent",
  },
  {
    phase: "onboarding",
    eventType: "check_in",
    title: "Week 1 wrap-up",
    description: "End of first week review. What went well? What was confusing? Adjust training pace if needed.",
    dayOffset: 7,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "onboarding",
    eventType: "check_in",
    title: "Week 2 check-in",
    description: "Are they settling in? Buddy relationship working? Any team friction? Record engagement level.",
    dayOffset: 14,
    assignedTo: "buddy",
    priority: "normal",
  },
  {
    phase: "onboarding",
    eventType: "milestone",
    title: "Day 30: One-month review",
    description: "Formal 30-day review. Compare current performance to DNA profile predictions. Discuss career goals.",
    dayOffset: 30,
    assignedTo: "manager",
    priority: "high",
  },

  // ═══════════════════════════════════════
  // PHASE 6: PROBATION (Day 30 to Day 90)
  // ═══════════════════════════════════════
  {
    phase: "probation",
    eventType: "check_in",
    title: "Day 45: Mid-probation check",
    description: "Halfway through probation. Are they on track? Any concerns from either side?",
    dayOffset: 45,
    assignedTo: "manager",
    priority: "normal",
  },
  {
    phase: "probation",
    eventType: "check_in",
    title: "Day 60: Two-month review",
    description: "Assess: independence level, team integration, skill development, alignment with role.",
    dayOffset: 60,
    assignedTo: "manager",
    priority: "high",
  },
  {
    phase: "probation",
    eventType: "alert",
    title: "Day 75: Probation decision reminder",
    description: "15 days until probation ends. Manager must decide: confirm, extend, or exit.",
    dayOffset: 75,
    assignedTo: "system",
    priority: "high",
  },
  {
    phase: "probation",
    eventType: "milestone",
    title: "🎉 Day 90: Probation complete",
    description: "Probation period ends. If confirmed → journey completes successfully. Celebrate the milestone!",
    dayOffset: 90,
    assignedTo: "manager",
    priority: "urgent",
  },
];

// ─── Create Journey ──────────────────────────────────────────
export async function createJourney(
  organizationId: string,
  candidateId: string
): Promise<string> {
  // 1. Create the journey blueprint
  const { data: journey, error } = await supabase
    .from("journey_blueprints")
    .insert({
      organization_id: organizationId,
      candidate_id: candidateId,
      status: "active",
      current_phase: "screening",
    })
    .select()
    .single();

  if (error || !journey) throw new Error("Failed to create journey: " + error?.message);

  // 2. Generate screening phase events
  const screeningEvents = JOURNEY_TEMPLATE
    .filter((t) => t.phase === "screening")
    .map((t) => ({
      journey_id: journey.id,
      organization_id: organizationId,
      phase: t.phase,
      event_type: t.eventType,
      title: t.title,
      description: t.description,
      day_offset: t.dayOffset,
      scheduled_for:
        t.dayOffset !== null
          ? addDays(new Date(), t.dayOffset).toISOString()
          : null,
      status: t.dayOffset === 0 ? "active" : "pending",
      assigned_to: t.assignedTo,
      priority: t.priority,
    }));

  const { error: eventsError } = await supabase
    .from("journey_events")
    .insert(screeningEvents);

  if (eventsError) {
    console.error("Failed to create screening events:", eventsError);
  }

  return journey.id;
}

// ─── Phase Transition ────────────────────────────────────────
export async function transitionPhase(
  journeyId: string,
  newPhase: string,
  options?: { startWorkDate?: Date }
): Promise<void> {
  // 1. Fetch journey for org ID
  const { data: journey } = await supabase
    .from("journey_blueprints")
    .select("organization_id, current_phase")
    .eq("id", journeyId)
    .single();

  if (!journey) throw new Error("Journey not found");

  // 2. Update journey phase
  const updateData: Record<string, unknown> = {
    current_phase: newPhase,
    updated_at: new Date().toISOString(),
  };

  if (newPhase === "offer") {
    updateData.offer_date = new Date().toISOString();
  }

  if ((newPhase === "pre_arrival" || newPhase === "offer") && options?.startWorkDate) {
    updateData.start_work_date = options.startWorkDate.toISOString();
    updateData.day_90_date = addDays(options.startWorkDate, 90).toISOString();
  }

  await supabase
    .from("journey_blueprints")
    .update(updateData)
    .eq("id", journeyId);

  // 3. Mark pending events from previous phase as skipped
  await supabase
    .from("journey_events")
    .update({ status: "skipped" })
    .eq("journey_id", journeyId)
    .eq("phase", journey.current_phase)
    .eq("status", "pending");

  // 4. Generate events for the new phase
  const referenceDate =
    newPhase === "pre_arrival" && options?.startWorkDate
      ? options.startWorkDate
      : new Date();

  const newEvents = JOURNEY_TEMPLATE
    .filter((t) => t.phase === newPhase)
    .map((t) => ({
      journey_id: journeyId,
      organization_id: journey.organization_id,
      phase: t.phase,
      event_type: t.eventType,
      title: t.title,
      description: t.description,
      day_offset: t.dayOffset,
      scheduled_for:
        t.dayOffset !== null
          ? addDays(referenceDate, t.dayOffset).toISOString()
          : null,
      status: t.dayOffset === 0 ? "active" : "pending",
      assigned_to: t.assignedTo,
      priority: t.priority,
    }));

  if (newEvents.length > 0) {
    await supabase.from("journey_events").insert(newEvents);
  }
}
