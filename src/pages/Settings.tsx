import { useState } from "react";
import { motion } from "framer-motion";
import { Settings as SettingsIcon, Users, UserCheck, ListChecks, Activity, Bell } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl border border-border/50 p-8">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <tab.icon className="w-7 h-7 text-muted-foreground" />
                </div>
                <h2 className="text-lg font-semibold mb-2">{tab.label}</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  This section will allow you to manage {tab.label.toLowerCase()}. Full functionality coming in Phase 3.
                </p>
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
