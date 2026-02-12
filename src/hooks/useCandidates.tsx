import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface DbCandidate {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  photo_url: string | null;
  resume_url: string | null;
  current_location: string | null;
  desired_location: string | null;
  referral_source: string | null;
  current_stage: string;
  days_in_stage: number;
  risk_level: string;
  engagement_score: number;
  last_contact_date: string | null;
  next_checkin_date: string | null;
  prescreening_complete: boolean;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateInsert {
  full_name: string;
  email: string;
  phone?: string;
  current_location?: string;
  desired_location?: string;
  referral_source?: string;
  organization_id?: string;
}

export function useCandidates() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["candidates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbCandidate[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (candidate: CandidateInsert) => {
      const { data, error } = await supabase
        .from("candidates")
        .insert(candidate)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Candidate added", description: "New candidate created successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DbCandidate> & { id: string }) => {
      const { data, error } = await supabase
        .from("candidates")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Updated", description: "Candidate updated successfully." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("candidates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Deleted", description: "Candidate removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return {
    candidates: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createCandidate: createMutation.mutateAsync,
    updateCandidate: updateMutation.mutateAsync,
    deleteCandidate: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
}
