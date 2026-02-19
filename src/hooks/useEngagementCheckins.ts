import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateVelocity, type EngagementCheckin, type VelocityScore } from "@/utils/velocityScoring";

export function useEngagementCheckins(candidateId: string | undefined) {
  const { data: checkins = [], isLoading, refetch } = useQuery({
    queryKey: ["engagement_checkins", candidateId],
    queryFn: async () => {
      if (!candidateId) return [];
      const { data, error } = await supabase
        .from("engagement_checkins")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("day_number", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as EngagementCheckin[];
    },
    enabled: !!candidateId,
    refetchInterval: 30000,
  });

  const velocity: VelocityScore = calculateVelocity(checkins);

  return { checkins, velocity, isLoading, refetch };
}

export function useVelocityForCandidate(candidateId: string | undefined) {
  const { data, isLoading } = useQuery({
    queryKey: ["velocity_score", candidateId],
    queryFn: async () => {
      if (!candidateId) return null;
      const { data, error } = await supabase
        .from("engagement_checkins")
        .select("*")
        .eq("candidate_id", candidateId)
        .order("day_number", { ascending: true });
      if (error) throw error;
      const checkins = (data || []) as unknown as EngagementCheckin[];
      if (checkins.length === 0) return null;
      return calculateVelocity(checkins);
    },
    enabled: !!candidateId,
    staleTime: 60000,
  });

  return { velocity: data, isLoading };
}
