import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Sparkles, AlertTriangle, Send, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { type Archetype, mockTeamMembers } from "@/data/mockData";

interface BuddyMatchingSectionProps {
  candidateId: string;
  candidateArchetype?: Archetype;
  organizationId: string;
  isDemoMode: boolean;
}

// Compatibility matrix
const COMPATIBILITY: Record<string, number> = {
  "lion-lion": 45, "lion-whale": 85, "lion-falcon": 70,
  "whale-lion": 85, "whale-whale": 90, "whale-falcon": 75,
  "falcon-lion": 70, "falcon-whale": 75, "falcon-falcon": 60,
};

function getCompatibility(a?: Archetype, b?: Archetype): number {
  if (!a || !b) return 50;
  return COMPATIBILITY[`${a}-${b}`] ?? 50;
}

function getMatchReason(candidateArchetype: Archetype, buddyArchetype: Archetype, buddyName: string, buddyDept: string): string {
  const reasons: Record<string, string> = {
    "lion-whale": `${buddyName} (Whale) naturally supports Lion leaders. Their collaborative style will balance the autonomy-driven approach. Experience in ${buddyDept} provides valuable mentorship.`,
    "lion-falcon": `${buddyName} (Falcon) excels at executing vision set by Lions. Their precision complements the leadership drive. Based in ${buddyDept}.`,
    "lion-lion": `${buddyName} is also a Lion — potential for shared leadership, but monitor for power dynamics. Both in ${buddyDept}.`,
    "whale-whale": `${buddyName} (Whale) creates excellent collaborative synergy. Mutual support and shared team-oriented values in ${buddyDept}.`,
    "whale-lion": `${buddyName} (Lion) provides strong direction while Whales bring team cohesion. Natural complementary pairing in ${buddyDept}.`,
    "whale-falcon": `${buddyName} (Falcon) brings systems thinking while Whales bring people skills. Good operational pairing in ${buddyDept}.`,
    "falcon-whale": `${buddyName} (Whale) brings relationship warmth to complement Falcon's precision. Strong cultural bridge in ${buddyDept}.`,
    "falcon-lion": `${buddyName} (Lion) sets the vision while Falcons execute with precision. Effective mentor-mentee dynamic in ${buddyDept}.`,
    "falcon-falcon": `${buddyName} (Falcon) shares the detail-oriented approach. Strong technical pairing but may need external initiative driver. In ${buddyDept}.`,
  };
  return reasons[`${candidateArchetype}-${buddyArchetype}`] ?? `${buddyName} in ${buddyDept} could be a suitable buddy.`;
}

const ARCHETYPE_EMOJIS: Record<string, string> = { lion: "🦁", whale: "🐋", falcon: "🦅" };

interface TeamMember {
  id: string;
  full_name: string;
  department: string;
  role: string;
  photo_url: string | null;
  tribe_viral_archetype: Archetype | null;
}

// Demo team members — sourced from centralised mock data
const DEMO_TEAM: TeamMember[] = mockTeamMembers.map((m) => ({
  id: m.id,
  full_name: m.full_name,
  department: m.department,
  role: m.role,
  photo_url: m.photo_url,
  tribe_viral_archetype: m.tribe_viral_archetype,
}));

export function BuddyMatchingSection({ candidateId, candidateArchetype, organizationId, isDemoMode }: BuddyMatchingSectionProps) {
  const [showAll, setShowAll] = useState(false);
  const [manualSelection, setManualSelection] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["team_members_buddy", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("team_members")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("is_available_as_buddy", true)
        .not("tribe_viral_archetype", "is", null);
      if (error) throw error;
      return data as TeamMember[];
    },
    enabled: !isDemoMode && !!organizationId,
  });

  const { data: existingAssignment } = useQuery({
    queryKey: ["buddy_assignment", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("buddy_assignments")
        .select("*, team_members(full_name, department, role, photo_url, tribe_viral_archetype)")
        .eq("candidate_id", candidateId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !isDemoMode,
  });

  const assignBuddy = useMutation({
    mutationFn: async ({ buddyId, score, reason }: { buddyId: string; score: number; reason: string }) => {
      // Delete existing assignment first
      await supabase.from("buddy_assignments").delete().eq("candidate_id", candidateId);
      const { error } = await supabase.from("buddy_assignments").insert({
        candidate_id: candidateId,
        buddy_id: buddyId,
        match_score: score,
        match_reason: reason,
        status: "suggested",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buddy_assignment", candidateId] });
      toast({ title: "Buddy assigned", description: "Team buddy has been selected." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const notifyBuddy = useMutation({
    mutationFn: async () => {
      if (!existingAssignment) return;
      const { error } = await supabase.from("buddy_assignments")
        .update({ status: "notified", notified_at: new Date().toISOString() })
        .eq("id", existingAssignment.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buddy_assignment", candidateId] });
      toast({ title: "Buddy notified", description: "Introduction email sent to buddy." });
    },
  });

  const team = isDemoMode ? DEMO_TEAM : (teamMembers.length > 0 ? teamMembers : DEMO_TEAM);

  // Calculate scored recommendations
  const recommendations = team
    .map((member) => {
      let score = getCompatibility(candidateArchetype, member.tribe_viral_archetype || undefined);
      // Bonus factors
      score = Math.min(100, score + 5); // fresh perspective bonus
      const reason = candidateArchetype && member.tribe_viral_archetype
        ? getMatchReason(candidateArchetype, member.tribe_viral_archetype, member.full_name, member.department)
        : `${member.full_name} in ${member.department} is available as a buddy.`;
      return { ...member, score, reason };
    })
    .sort((a, b) => b.score - a.score);

  const top3 = recommendations.slice(0, 3);
  const scoreColor = (s: number) => s >= 80 ? "text-success" : s >= 60 ? "text-primary" : "text-destructive";
  const scoreBg = (s: number) => s >= 80 ? "bg-success/15 border-success/30" : s >= 60 ? "bg-primary/15 border-primary/30" : "bg-destructive/15 border-destructive/30";

  const currentBuddy = isDemoMode
    ? { team_members: DEMO_TEAM[0], match_score: 85, match_reason: getMatchReason("lion", "whale", DEMO_TEAM[0].full_name, DEMO_TEAM[0].department), status: "active" }
    : existingAssignment;

  return (
    <div className="space-y-6">
      {/* Current Assignment */}
      {currentBuddy && (
        <div className="bg-card rounded-xl border border-border/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Current Buddy Assignment</h2>
          <div className="flex items-start gap-4 p-4 rounded-xl bg-success/5 border border-success/20">
            <div className="w-14 h-14 rounded-full bg-muted overflow-hidden border-2 border-success/30 flex items-center justify-center text-2xl flex-shrink-0">
              {ARCHETYPE_EMOJIS[(currentBuddy as any).team_members?.tribe_viral_archetype] || "👤"}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className="font-semibold">{(currentBuddy as any).team_members?.full_name}</p>
                <Badge className="bg-success/20 text-success border-0 text-[10px] capitalize">{(currentBuddy as any).status}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">{(currentBuddy as any).team_members?.role} · {(currentBuddy as any).team_members?.department}</p>
              <p className="text-sm mt-2 text-muted-foreground">{(currentBuddy as any).match_reason}</p>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-lg font-bold ${scoreColor((currentBuddy as any).match_score || 0)}`}>
                  {(currentBuddy as any).match_score}% Match
                </span>
              </div>
            </div>
            {!isDemoMode && (currentBuddy as any).status !== "notified" && (currentBuddy as any).status !== "active" && (
              <Button size="sm" variant="outline" className="gap-1" onClick={() => notifyBuddy.mutate()}>
                <Send className="w-3.5 h-3.5" />Notify Buddy
              </Button>
            )}
          </div>
        </div>
      )}

      {/* AI Recommendations */}
      <div className="bg-card rounded-xl border border-border/50 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Buddy Recommendations</h2>
          </div>
          {!candidateArchetype && (
            <Badge variant="secondary">Archetype data needed for matching</Badge>
          )}
        </div>

        {candidateArchetype ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <AnimatePresence>
                {top3.map((buddy, i) => (
                  <motion.div key={buddy.id}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className={`rounded-xl border p-4 ${scoreBg(buddy.score)}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-xl flex-shrink-0">
                        {ARCHETYPE_EMOJIS[buddy.tribe_viral_archetype || ""] || "👤"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{buddy.full_name}</p>
                        <p className="text-[10px] text-muted-foreground">{buddy.role} · {buddy.department}</p>
                      </div>
                    </div>

                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.15, type: "spring" }}
                      className="text-center mb-3">
                      <span className={`text-3xl font-bold ${scoreColor(buddy.score)}`}>{buddy.score}%</span>
                      <p className="text-[10px] text-muted-foreground">
                        {buddy.score >= 80 ? "Excellent Match" : buddy.score >= 60 ? "Good Match" : "Risky Match"}
                      </p>
                    </motion.div>

                    <p className="text-xs text-muted-foreground mb-3 line-clamp-3">{buddy.reason}</p>

                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 text-xs h-7 gold-glow-hover"
                        onClick={() => {
                          if (!isDemoMode) {
                            assignBuddy.mutate({ buddyId: buddy.id, score: buddy.score, reason: buddy.reason });
                          } else {
                            toast({ title: "Demo mode", description: "Buddy selection is simulated." });
                          }
                        }}>
                        Select as Buddy
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Manual Override */}
            <div className="border-t border-border/50 pt-4">
              <p className="text-xs text-muted-foreground mb-2">Or choose manually:</p>
              <div className="flex gap-2">
                <Select value={manualSelection} onValueChange={setManualSelection}>
                  <SelectTrigger className="bg-muted/50 flex-1">
                    <SelectValue placeholder="Select team member..." />
                  </SelectTrigger>
                  <SelectContent>
                    {recommendations.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.full_name} — {m.department} ({m.score}%)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" disabled={!manualSelection}
                  onClick={() => {
                    const selected = recommendations.find(r => r.id === manualSelection);
                    if (selected) {
                      if (selected.score < 60) {
                        toast({
                          title: "⚠️ Low Compatibility",
                          description: `Compatibility score is ${selected.score}% — consider risks`,
                          variant: "destructive",
                        });
                      }
                      if (!isDemoMode) {
                        assignBuddy.mutate({ buddyId: selected.id, score: selected.score, reason: selected.reason });
                      } else {
                        toast({ title: "Demo mode", description: "Buddy selection is simulated." });
                      }
                    }
                  }}>
                  Assign
                </Button>
              </div>
              {manualSelection && (() => {
                const sel = recommendations.find(r => r.id === manualSelection);
                return sel && sel.score < 60 ? (
                  <div className="mt-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">Compatibility score is {sel.score}% — consider risks before proceeding</p>
                  </div>
                ) : null;
              })()}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-10">
            <Users className="w-10 h-10 text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Complete the pre-screening assessment to enable AI-powered buddy matching.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
