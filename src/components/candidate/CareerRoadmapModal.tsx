import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Target, TrendingUp, AlertTriangle, Lightbulb, Calendar } from "lucide-react";

interface CareerRoadmapModalProps {
  candidateName: string;
  archetype: string;
}

const ARCHETYPE_ROADMAPS: Record<string, {
  trajectory: string;
  milestones: { period: string; goal: string; type: "short" | "mid" | "long" }[];
  nextRoles: string[];
  riskWindows: { period: string; risk: string; mitigation: string }[];
  development: string[];
}> = {
  lion: {
    trajectory: "Leadership & Management Track",
    milestones: [
      { period: "0-6 months", goal: "Master core role responsibilities and team dynamics", type: "short" },
      { period: "6-12 months", goal: "Lead a project or initiative independently", type: "short" },
      { period: "1-2 years", goal: "Progress to senior/supervisory position", type: "mid" },
      { period: "2-3 years", goal: "Department or team leadership role", type: "mid" },
      { period: "3-5 years", goal: "Senior management or director-level position", type: "long" },
    ],
    nextRoles: ["Team Lead", "Shift Supervisor", "Assistant Manager", "Department Head", "Operations Director"],
    riskWindows: [
      { period: "Month 3-4", risk: "Initial adjustment — may feel constrained by processes", mitigation: "Give ownership of a small project early" },
      { period: "Month 6-8", risk: "May seek leadership if not given autonomy", mitigation: "Assign mentoring responsibilities or team lead duties" },
      { period: "Month 12-18", risk: "Flight risk if no promotion pathway visible", mitigation: "Discuss career progression plan, offer training budget" },
    ],
    development: [
      "Leadership & people management training",
      "Decision-making and strategic thinking workshops",
      "Conflict resolution and negotiation skills",
      "Financial literacy and P&L management",
      "Cross-department collaboration projects",
    ],
  },
  whale: {
    trajectory: "Collaborative Specialist Track",
    milestones: [
      { period: "0-6 months", goal: "Build strong team relationships and integrate fully", type: "short" },
      { period: "6-12 months", goal: "Become the go-to team connector and knowledge sharer", type: "short" },
      { period: "1-2 years", goal: "Training or mentoring role within department", type: "mid" },
      { period: "2-3 years", goal: "Team coordination or HR-adjacent role", type: "mid" },
      { period: "3-5 years", goal: "People operations or culture leadership", type: "long" },
    ],
    nextRoles: ["Team Coordinator", "Training Specialist", "Culture Ambassador", "HR Partner", "People Operations Lead"],
    riskWindows: [
      { period: "Month 2-3", risk: "May feel isolated if team dynamics are poor", mitigation: "Ensure buddy system is active and team socials scheduled" },
      { period: "Month 8-10", risk: "Burnout from over-helping others", mitigation: "Set clear boundaries and recognise contributions" },
      { period: "Month 14-18", risk: "May feel undervalued if contributions aren't recognised", mitigation: "Implement peer recognition programme" },
    ],
    development: [
      "Advanced communication and facilitation",
      "Coaching and mentoring certification",
      "Team dynamics and group psychology",
      "Wellness and employee engagement strategies",
      "Diversity and inclusion training",
    ],
  },
  falcon: {
    trajectory: "Technical Excellence Track",
    milestones: [
      { period: "0-6 months", goal: "Master all standard operating procedures", type: "short" },
      { period: "6-12 months", goal: "Identify and implement process improvements", type: "short" },
      { period: "1-2 years", goal: "Quality assurance or specialist role", type: "mid" },
      { period: "2-3 years", goal: "Process design or compliance leadership", type: "mid" },
      { period: "3-5 years", goal: "Operations excellence or technical director", type: "long" },
    ],
    nextRoles: ["Quality Specialist", "Process Analyst", "Compliance Officer", "Standards Manager", "Technical Director"],
    riskWindows: [
      { period: "Month 1-2", risk: "Frustrated by lack of clear procedures", mitigation: "Provide comprehensive SOPs and documentation" },
      { period: "Month 6-8", risk: "Boredom if role lacks complexity", mitigation: "Introduce analytical projects or quality audits" },
      { period: "Month 12-16", risk: "May disengage if quality standards aren't valued", mitigation: "Create quality champion role with visible impact" },
    ],
    development: [
      "Advanced data analysis and reporting",
      "Quality management systems (ISO, Six Sigma)",
      "Process optimisation methodologies",
      "Regulatory compliance and audit training",
      "Technical writing and documentation",
    ],
  },
};

const typeColors = { short: "bg-primary/10 text-primary", mid: "bg-blue-500/10 text-blue-400", long: "bg-purple-500/10 text-purple-400" };

export function CareerRoadmapModal({ candidateName, archetype }: CareerRoadmapModalProps) {
  const [open, setOpen] = useState(false);
  const roadmap = ARCHETYPE_ROADMAPS[archetype];

  if (!roadmap) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1 text-primary">
          <ExternalLink className="w-3.5 h-3.5" /> View Full Roadmap
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Career Roadmap — {candidateName}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{roadmap.trajectory}</p>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* 5-Year Milestones */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-primary" /> 5-Year Trajectory
            </h3>
            <div className="space-y-2">
              {roadmap.milestones.map((m, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/30">
                  <Badge variant="secondary" className={`text-[10px] shrink-0 ${typeColors[m.type]}`}>
                    {m.period}
                  </Badge>
                  <p className="text-sm">{m.goal}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Next Roles */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" /> Recommended Next Roles
            </h3>
            <div className="flex flex-wrap gap-2">
              {roadmap.nextRoles.map((role, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  {i === 0 ? "🎯 " : ""}{role}
                </Badge>
              ))}
            </div>
          </section>

          {/* Retention Risk Windows */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive" /> Retention Risk Windows
            </h3>
            <div className="space-y-2">
              {roadmap.riskWindows.map((rw, i) => (
                <div key={i} className="p-3 rounded-lg bg-destructive/5 border border-destructive/15">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px] bg-destructive/10 text-destructive">{rw.period}</Badge>
                    <span className="text-sm font-medium">{rw.risk}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-1">💡 {rw.mitigation}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Development */}
          <section>
            <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4 text-primary" /> Development Opportunities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {roadmap.development.map((d, i) => (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded-lg bg-muted/20">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{d}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
