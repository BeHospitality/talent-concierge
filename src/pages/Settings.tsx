import { motion } from "framer-motion";
import { Users, UserCheck, ListChecks, Activity, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HiringManagersSettings } from "@/components/settings/HiringManagersSettings";
import { TeamDirectorySettings } from "@/components/settings/TeamDirectorySettings";
import { ChecklistTemplatesSettings } from "@/components/settings/ChecklistTemplatesSettings";
import { EngagementRulesSettings } from "@/components/settings/EngagementRulesSettings";
import { NotificationsSettings } from "@/components/settings/NotificationsSettings";

const tabs = [
  { id: "managers", label: "Hiring Managers", icon: Users },
  { id: "team", label: "Team Directory", icon: UserCheck },
  { id: "templates", label: "Checklist Templates", icon: ListChecks },
  { id: "engagement", label: "Engagement Rules", icon: Activity },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function Settings() {
  return (
    <div className="max-w-[1600px] mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure hiring managers, team members, templates, and engagement rules</p>
      </motion.div>

      <Tabs defaultValue="managers">
        <TabsList className="bg-card border border-border/50 mb-6">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="managers">
          <HiringManagersSettings />
        </TabsContent>
        <TabsContent value="team">
          <TeamDirectorySettings />
        </TabsContent>
        <TabsContent value="templates">
          <ChecklistTemplatesSettings />
        </TabsContent>
        <TabsContent value="engagement">
          <EngagementRulesSettings />
        </TabsContent>
        <TabsContent value="notifications">
          <NotificationsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
