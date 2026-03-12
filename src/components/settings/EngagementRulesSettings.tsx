import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Bell, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Rule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  icon: any;
}

export function EngagementRulesSettings() {
  const { toast } = useToast();

  const [checkInRules, setCheckInRules] = useState<Rule[]>([
    { id: "day7", name: "Day 7 Check-in", description: "Automatically prompt a check-in 7 days after placement starts", enabled: true, icon: Clock },
    { id: "day30", name: "Day 30 Check-in", description: "Trigger a milestone check-in at 30 days", enabled: true, icon: Clock },
    { id: "day60", name: "Day 60 Check-in", description: "Trigger a milestone check-in at 60 days", enabled: true, icon: Clock },
    { id: "day90", name: "Day 90 Review", description: "Full performance review check-in at 90 days", enabled: true, icon: Clock },
  ]);

  const [interventionRules, setInterventionRules] = useState<Rule[]>([
    { id: "low-mood", name: "Low Mood Alert", description: "Create intervention when mood score drops below 2 for two consecutive check-ins", enabled: true, icon: AlertTriangle },
    { id: "high-risk", name: "High Risk Flag", description: "Auto-flag candidate as high risk when engagement score drops below 40%", enabled: true, icon: AlertTriangle },
    { id: "missed-checkin", name: "Missed Check-ins", description: "Trigger re-engagement when 2+ consecutive check-ins are missed", enabled: false, icon: AlertTriangle },
    { id: "churn-warning", name: "Churn Prediction Warning", description: "Alert when churn prediction exceeds 70% probability", enabled: true, icon: AlertTriangle },
  ]);

  const [notificationRules, setNotificationRules] = useState<Rule[]>([
    { id: "notify-manager", name: "Notify Hiring Manager", description: "Send notification to hiring manager when candidate completes check-in", enabled: false, icon: Bell },
    { id: "notify-admin-risk", name: "Admin Risk Alerts", description: "Notify admins when any candidate is flagged as high risk", enabled: true, icon: Bell },
    { id: "notify-dossier", name: "Dossier View Alerts", description: "Notify when a hiring manager views a dossier", enabled: true, icon: Bell },
    { id: "notify-journey", name: "Journey Milestone Alerts", description: "Notify when candidates reach journey milestones", enabled: false, icon: Bell },
  ]);

  const [moodThreshold, setMoodThreshold] = useState("2");
  const [engagementThreshold, setEngagementThreshold] = useState("40");
  const [churnThreshold, setChurnThreshold] = useState("70");

  const toggleRule = (rules: Rule[], setRules: (r: Rule[]) => void, id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const handleSave = () => {
    toast({ title: "Settings saved", description: "Engagement rules have been updated" });
  };

  const RulesList = ({ rules, setRules }: { rules: Rule[]; setRules: (r: Rule[]) => void }) => (
    <div className="space-y-3">
      {rules.map((rule) => (
        <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/20 transition-colors">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
              <rule.icon className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">{rule.name}</p>
              <p className="text-xs text-muted-foreground">{rule.description}</p>
            </div>
          </div>
          <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rules, setRules, rule.id)} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Clock className="w-4 h-4 text-primary" />Check-in Triggers</CardTitle>
            <CardDescription>Automatically trigger check-ins based on journey timeline</CardDescription>
          </CardHeader>
          <CardContent>
            <RulesList rules={checkInRules} setRules={setCheckInRules} />
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" />Intervention Triggers</CardTitle>
            <CardDescription>Automatically create interventions based on engagement data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RulesList rules={interventionRules} setRules={setInterventionRules} />
            <div className="border-t border-border/50 pt-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Thresholds</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Mood Threshold</Label>
                  <Input type="number" min="1" max="5" value={moodThreshold} onChange={(e) => setMoodThreshold(e.target.value)} className="mt-1 bg-muted/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Engagement % Threshold</Label>
                  <Input type="number" min="0" max="100" value={engagementThreshold} onChange={(e) => setEngagementThreshold(e.target.value)} className="mt-1 bg-muted/50" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Churn % Threshold</Label>
                  <Input type="number" min="0" max="100" value={churnThreshold} onChange={(e) => setChurnThreshold(e.target.value)} className="mt-1 bg-muted/50" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Card className="border-border/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4 text-primary" />Notification Rules</CardTitle>
            <CardDescription>Configure when and who receives notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <RulesList rules={notificationRules} setRules={setNotificationRules} />
          </CardContent>
        </Card>
      </motion.div>

      <div className="flex justify-end">
        <Button className="gold-glow-hover" onClick={handleSave}>Save Engagement Rules</Button>
      </div>
    </div>
  );
}
