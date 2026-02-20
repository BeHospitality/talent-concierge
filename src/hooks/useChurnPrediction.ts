import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { predictChurn, type ChurnPrediction } from "@/utils/churnPrediction";
import type { EngagementCheckin } from "@/utils/velocityScoring";

const CACHE_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

export function useChurnPrediction(candidateId: string | undefined, journeyId?: string | undefined) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["churn_prediction", candidateId, journeyId],
    queryFn: async (): Promise<ChurnPrediction | null> => {
      if (!candidateId) return null;

      // Try to find journey for this candidate
      let jId = journeyId;
      let journeyData: any = null;

      if (!jId) {
        const { data: jd } = await supabase
          .from("journey_blueprints")
          .select("id, start_work_date, start_date, churn_prediction, churn_updated_at, status")
          .eq("candidate_id", candidateId)
          .eq("status", "active")
          .maybeSingle();
        if (!jd) return null;
        journeyData = jd;
        jId = jd.id;
      } else {
        const { data: jd } = await supabase
          .from("journey_blueprints")
          .select("id, start_work_date, start_date, churn_prediction, churn_updated_at, status")
          .eq("id", jId)
          .maybeSingle();
        journeyData = jd;
      }

      if (!journeyData) return null;

      // Check cache
      if (journeyData.churn_prediction && journeyData.churn_updated_at) {
        const age = Date.now() - new Date(journeyData.churn_updated_at).getTime();
        if (age < CACHE_DURATION_MS) {
          return journeyData.churn_prediction as unknown as ChurnPrediction;
        }
      }

      // Fetch all inputs in parallel
      const [checkinsRes, eventsRes, buddyRes, riskRes] = await Promise.all([
        supabase
          .from("engagement_checkins")
          .select("*")
          .eq("candidate_id", candidateId)
          .order("day_number", { ascending: true }),
        supabase
          .from("journey_events")
          .select("status, scheduled_for")
          .eq("journey_id", jId!),
        supabase
          .from("buddy_assignments")
          .select("id, status")
          .eq("candidate_id", candidateId)
          .maybeSingle(),
        supabase
          .from("placement_risks")
          .select("risk_level, risk_score")
          .eq("candidate_id", candidateId)
          .order("calculated_at", { ascending: false })
          .maybeSingle(),
      ]);

      const checkins = (checkinsRes.data || []) as unknown as EngagementCheckin[];
      const events = eventsRes.data || [];
      const buddy = buddyRes.data;
      const risk = riskRes.data;

      const prediction = predictChurn(
        checkins,
        { start_work_date: journeyData.start_work_date, start_date: journeyData.start_date },
        events,
        buddy,
        risk,
      );

      // Cache result
      await supabase
        .from("journey_blueprints")
        .update({
          churn_prediction: prediction as any,
          churn_updated_at: new Date().toISOString(),
        })
        .eq("id", jId!);

      return prediction;
    },
    enabled: !!candidateId,
    staleTime: 60000,
  });

  return { prediction: data ?? null, isLoading };
}

// Lightweight hook for pipeline cards — uses cached data only
export function useChurnForCandidate(candidateId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ["churn_cached", candidateId],
    queryFn: async (): Promise<ChurnPrediction | null> => {
      if (!candidateId) return null;
      const { data: jd } = await supabase
        .from("journey_blueprints")
        .select("churn_prediction, churn_updated_at, start_work_date, start_date")
        .eq("candidate_id", candidateId)
        .eq("status", "active")
        .maybeSingle();

      if (!jd?.churn_prediction) return null;

      // If cache is fresh enough, return it
      if (jd.churn_updated_at) {
        const age = Date.now() - new Date(jd.churn_updated_at).getTime();
        if (age < CACHE_DURATION_MS) {
          return jd.churn_prediction as unknown as ChurnPrediction;
        }
      }
      return null;
    },
    enabled: !!candidateId,
    staleTime: 120000,
  });

  return { prediction: data ?? null, isLoading };
}
