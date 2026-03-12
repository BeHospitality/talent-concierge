import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Mail, Smartphone, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useIsAdmin } from "@/hooks/useIsAdmin";

export function NotificationsSettings() {
  const { toast } = useToast();
  const { isAdmin } = useIsAdmin();

  // Personal preferences
  const [emailEnabled, setEmailEnabled] = useState(true);
  const [inAppEnabled, setInAppEnabled] = useState(true);

  const [notifyNewCandidate, setNotifyNewCandidate] = useState(true);
  const [notifyCheckIn, setNotifyCheckIn] = useState(true);
  const [notifyHighRisk, setNotifyHighRisk] = useState(true);
  const [notifyDossierView, setNotifyDossierView] = useState(true);
  const [notifyJourneyMilestone, setNotifyJourneyMilestone] = useState(false);
  const [notifyInterventionCreated, setNotifyInterventionCreated] = useState(true);

  // Org-level
  const [orgDailyDigest, setOrgDailyDigest] = useState(false);
  const [orgWeeklyReport, setOrgWeeklyReport] = useState(true);
  const [orgAutoEscalate, setOrgAutoEscalate] = useState(true);

  // System
  const [systemMaintenanceAlerts, setSystemMaintenanceAlerts] = useState(true);
  const [systemSecurityAlerts, setSystemSecurityAlerts] = useState(true);

  const handleSave = () => {
    toast({ title: "Preferences saved", description: "Your notification settings have been updated" });
  };

  return (
    <Tabs defaultValue="personal">
      <TabsList className="bg-muted/50 mb-6">
        <TabsTrigger value="personal">Personal</TabsTrigger>
        <TabsTrigger value="organization">Organization</TabsTrigger>
        {isAdmin && <TabsTrigger value="system">System</TabsTrigger>}
      </TabsList>

      <TabsContent value="personal">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Your Notification Preferences</CardTitle>
              <CardDescription>Control how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Channels */}
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Channels</p>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email Notifications</p>
                      <p className="text-xs text-muted-foreground">Receive email updates for important events</p>
                    </div>
                  </div>
                  <Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">In-App Notifications</p>
                      <p className="text-xs text-muted-foreground">Show notifications in the Hub interface</p>
                    </div>
                  </div>
                  <Switch checked={inAppEnabled} onCheckedChange={setInAppEnabled} />
                </div>
              </div>

              <Separator />

              {/* Event types */}
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notify me when</p>
                {[
                  { id: "new-candidate", label: "New candidate added", checked: notifyNewCandidate, onChange: setNotifyNewCandidate },
                  { id: "check-in", label: "Candidate completes check-in", checked: notifyCheckIn, onChange: setNotifyCheckIn },
                  { id: "high-risk", label: "Candidate flagged as high risk", checked: notifyHighRisk, onChange: setNotifyHighRisk },
                  { id: "dossier-viewed", label: "Dossier viewed by hiring manager", checked: notifyDossierView, onChange: setNotifyDossierView },
                  { id: "journey-milestone", label: "Candidate reaches journey milestone", checked: notifyJourneyMilestone, onChange: setNotifyJourneyMilestone },
                  { id: "intervention", label: "Intervention created for my candidates", checked: notifyInterventionCreated, onChange: setNotifyInterventionCreated },
                ].map((pref) => (
                  <div key={pref.id} className="flex items-center space-x-3 p-2">
                    <Checkbox id={pref.id} checked={pref.checked} onCheckedChange={(v) => pref.onChange(!!v)} />
                    <Label htmlFor={pref.id} className="text-sm cursor-pointer">{pref.label}</Label>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button className="gold-glow-hover" onClick={handleSave}>Save Preferences</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      <TabsContent value="organization">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Organization Notification Settings</CardTitle>
              <CardDescription>Configure notifications for your entire organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Daily Digest", desc: "Send a daily summary of all candidate activity", checked: orgDailyDigest, onChange: setOrgDailyDigest },
                { label: "Weekly Report", desc: "Automated weekly engagement report to managers", checked: orgWeeklyReport, onChange: setOrgWeeklyReport },
                { label: "Auto-Escalation", desc: "Automatically escalate high-risk candidates to admins", checked: orgAutoEscalate, onChange: setOrgAutoEscalate },
              ].map((setting, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                  <div>
                    <p className="text-sm font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.desc}</p>
                  </div>
                  <Switch checked={setting.checked} onCheckedChange={setting.onChange} />
                </div>
              ))}
              <div className="flex justify-end pt-2">
                <Button className="gold-glow-hover" onClick={handleSave}>Save Settings</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </TabsContent>

      {isAdmin && (
        <TabsContent value="system">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base">System Notifications</CardTitle>
                <CardDescription>Platform-wide notification configuration (admin only)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: "Maintenance Alerts", desc: "Notify all users about scheduled maintenance", checked: systemMaintenanceAlerts, onChange: setSystemMaintenanceAlerts },
                  { label: "Security Alerts", desc: "Notify admins of security-related events", checked: systemSecurityAlerts, onChange: setSystemSecurityAlerts },
                ].map((setting, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50">
                    <div>
                      <p className="text-sm font-medium">{setting.label}</p>
                      <p className="text-xs text-muted-foreground">{setting.desc}</p>
                    </div>
                    <Switch checked={setting.checked} onCheckedChange={setting.onChange} />
                  </div>
                ))}
                <div className="flex justify-end pt-2">
                  <Button className="gold-glow-hover" onClick={handleSave}>Save Settings</Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      )}
    </Tabs>
  );
}
