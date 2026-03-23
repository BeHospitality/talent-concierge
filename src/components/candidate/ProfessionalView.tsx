import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, MessageCircle, Check, Circle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const GOLD = "#F59E0B";
const NAVY = "#002452";
const NAVY_LIGHT = "#003478";
const NAVY_CARD = "#0a3060";

function PhoneCard({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: "easeOut" }}
      className="rounded-2xl p-5 mb-4"
      style={{ background: NAVY_CARD, border: `1px solid ${NAVY_LIGHT}` }}
    >
      {children}
    </motion.div>
  );
}

function BuddyChatPopup({ onClose }: { onClose: () => void }) {
  const [replies, setReplies] = useState<string[]>([]);
  const quickReplies = [
    "Where do I park? 🚗",
    "What should I wear? 👨‍🍳",
    "What time do I start? ⏰",
    "What's the team like? 🤝",
  ];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4 mt-3"
      style={{ background: "#001a3d", border: `1px solid ${GOLD}40` }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold" style={{ color: GOLD }}>💬 Chat with Tom</span>
        <button onClick={onClose} className="opacity-60 hover:opacity-100"><X className="w-3.5 h-3.5 text-white" /></button>
      </div>
      <div className="rounded-xl p-3 mb-3" style={{ background: NAVY_LIGHT }}>
        <p className="text-sm text-white/90">
          "Hey James! Really looking forward to working with you. I know starting somewhere new can feel daunting - ask me anything, seriously anything, before your first day 👊"
        </p>
        <p className="text-[10px] text-white/40 mt-1">Tom Burke</p>
      </div>
      {replies.map((r, i) => (
        <div key={i} className="rounded-xl p-3 mb-2 ml-8" style={{ background: `${GOLD}30` }}>
          <p className="text-sm text-white/90">{r}</p>
        </div>
      ))}
      <div className="flex flex-wrap gap-2 mt-2">
        {quickReplies.filter(q => !replies.includes(q)).map((q) => (
          <button
            key={q}
            onClick={() => setReplies(p => [...p, q])}
            className="text-xs px-3 py-1.5 rounded-full transition-colors hover:brightness-110"
            style={{ background: `${GOLD}20`, color: GOLD, border: `1px solid ${GOLD}40` }}
          >
            {q}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

export function ProfessionalView() {
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedGift, setSelectedGift] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Manager Preview Banner */}
      <div className="rounded-xl p-4" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}40` }}>
        <p className="text-sm font-semibold" style={{ color: GOLD }}>👀 Manager Preview</p>
        <p className="text-xs text-muted-foreground mt-1">
          This is what James receives the moment he accepts his offer
        </p>
      </div>

      {/* Phone Frame */}
      <div className="flex justify-center">
        <div
          className="w-full max-w-[380px] rounded-[32px] overflow-hidden"
          style={{
            border: `3px solid ${NAVY_LIGHT}`,
            boxShadow: `0 25px 60px -12px rgba(0,0,0,0.5), 0 0 40px ${NAVY}80`,
          }}
        >
          {/* Phone notch */}
          <div className="flex justify-center pt-3 pb-1" style={{ background: NAVY }}>
            <div className="w-24 h-5 rounded-full" style={{ background: NAVY_LIGHT }} />
          </div>

          {/* Phone content */}
          <div
            className="px-5 pb-8 overflow-y-auto"
            style={{ background: NAVY, maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="text-center py-6">
              <p className="text-lg font-bold" style={{ color: GOLD }}>Be Connect</p>
              <p className="text-white text-base font-semibold mt-2">Your Harrow House Journey</p>
              <p className="text-white/80 text-sm mt-1">Welcome, James 👋</p>
              <span
                className="inline-block mt-3 text-xs font-semibold px-4 py-1.5 rounded-full"
                style={{ background: `${GOLD}25`, color: GOLD }}
              >
                Offer Accepted ✓
              </span>
            </div>

            {/* Card 1: Welcome Video */}
            <PhoneCard delay={0.1}>
              <p className="text-white font-semibold text-sm mb-1">A message for you</p>
              <p className="text-white/60 text-xs mb-3">From Claire Hennessy, General Manager</p>
              <div
                className="relative rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group"
                style={{ background: "#001530", height: 180 }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center z-10 group-hover:scale-110 transition-transform"
                  style={{ background: GOLD }}
                >
                  <Play className="w-6 h-6 text-white ml-0.5" fill="white" />
                </div>
                <span className="absolute bottom-2 right-3 text-[10px] text-white/60 z-10">2:14</span>
              </div>
              <p className="text-white/50 text-[11px] mt-2 italic">
                Aidan recorded this personally for every new team member
              </p>
            </PhoneCard>

            {/* Card 2: Buddy */}
            <PhoneCard delay={0.2}>
              <p className="text-white font-semibold text-sm mb-3">Meet Tom, your Buddy</p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2" style={{ borderColor: GOLD }}>
                  <img src="https://api.dicebear.com/7.x/personas/svg?seed=tom-burke" alt="Tom" className="w-full h-full" />
                </div>
                <div>
                  <p className="text-white text-sm font-medium">Tom Burke</p>
                  <p className="text-white/60 text-xs">FOH Supervisor • 5 Years at Ashford Manor</p>
                </div>
              </div>
              <span className="inline-block text-xs px-3 py-1 rounded-full mb-2" style={{ background: `${GOLD}20`, color: GOLD }}>
                🦁 Lion
              </span>
              <p className="text-white/70 text-xs mb-3">
                Matched to your Falcon style • Precision meets leadership
              </p>
              <Button
                size="sm"
                className="w-full gap-2 text-xs font-semibold"
                style={{ background: GOLD, color: "#000" }}
                onClick={() => setChatOpen(!chatOpen)}
              >
                <MessageCircle className="w-3.5 h-3.5" /> Message Tom
              </Button>
              <AnimatePresence>
                {chatOpen && <BuddyChatPopup onClose={() => setChatOpen(false)} />}
              </AnimatePresence>
            </PhoneCard>

            {/* Card 3: Breaking of Bread */}
            <PhoneCard delay={0.3}>
              <p className="text-white font-semibold text-sm mb-2">🎁 A Welcome Gift from Ashford Manor</p>
              <p className="text-white/70 text-xs mb-4">
                Before your first shift, we'd love to welcome you properly.
              </p>
              <div className="space-y-3 mb-4">
                {[
                  { id: "dinner", emoji: "🍽️", title: "Dinner for Two", desc: "Complimentary dinner at our Manor Restaurant for you and a guest" },
                  { id: "stay", emoji: "🏰", title: "Manor Overnight Stay", desc: "One night in our Manor accommodation with breakfast" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedGift(opt.id)}
                    className="w-full text-left rounded-xl p-3 transition-all"
                    style={{
                      background: selectedGift === opt.id ? `${GOLD}20` : NAVY_LIGHT,
                      border: `1px solid ${selectedGift === opt.id ? GOLD : "transparent"}`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selectedGift === opt.id ? GOLD : "rgba(255,255,255,0.3)" }}>
                        {selectedGift === opt.id && <div className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                      </div>
                      <span className="text-sm">{opt.emoji} {opt.title}</span>
                    </div>
                    <p className="text-white/50 text-xs ml-6">{opt.desc}</p>
                  </button>
                ))}
              </div>
              <Button size="sm" className="w-full text-xs font-semibold" style={{ background: GOLD, color: "#000" }}>
                Claim Your Welcome Gift →
              </Button>
              <p className="text-white/40 text-[10px] mt-2 text-center italic">
                Our gift to you. No strings. Just our way of saying welcome to the family.
              </p>
            </PhoneCard>

            {/* Card 4: First Week */}
            <PhoneCard delay={0.4}>
              <p className="text-white font-semibold text-sm mb-3">📅 Week 1 at Ashford Manor</p>
              <div className="space-y-2.5">
                {[
                  { day: "Mon 3 Mar", done: true, text: "Induction Day with Aidan (9am-1pm)" },
                  { day: "Tue 4 Mar", done: false, text: "Sous Chef orientation with Tom (10am)" },
                  { day: "Wed 5 Mar", done: false, text: "First service with the kitchen team (2pm)" },
                  { day: "Thu 6 Mar", done: false, text: "Menu & ingredients walkthrough" },
                  { day: "Fri 7 Mar", done: false, text: "End of week check-in with Tom + Aidan" },
                ].map((d, i) => (
                  <div key={i} className="flex items-start gap-3">
                    {d.done ? (
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: GOLD }} />
                    ) : (
                      <Circle className="w-4 h-4 mt-0.5 flex-shrink-0 text-white/30" />
                    )}
                    <div>
                      <p className="text-xs font-semibold text-white/80">{d.day}</p>
                      <p className="text-xs text-white/60">{d.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </PhoneCard>

            {/* Card 5: Badge Vault */}
            <PhoneCard delay={0.5}>
              <p className="text-white font-semibold text-sm mb-1">🏆 Your Learning Journey</p>
              <p className="text-white/60 text-xs mb-4">Earn badges. Build your career.</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { name: "Our Culture", emoji: "🏛️", color: NAVY_LIGHT },
                  { name: "Food Safety & HACCP", emoji: "🛡️", color: "#166534" },
                  { name: "Kitchen Precision", emoji: "🦅", color: "#c2410c" },
                  { name: "Five Star Service", emoji: "⭐", color: "#92400e" },
                ].map((b) => (
                  <div key={b.name} className="rounded-xl p-3 text-center" style={{ background: b.color }}>
                    <p className="text-2xl mb-1">{b.emoji}</p>
                    <p className="text-[11px] text-white font-medium">{b.name}</p>
                    <p className="text-[10px] text-white/50 mt-1">0%</p>
                  </div>
                ))}
              </div>
              <div className="h-2 rounded-full mb-2" style={{ background: NAVY_LIGHT }}>
                <div className="h-full rounded-full w-0" style={{ background: GOLD }} />
              </div>
              <p className="text-white/50 text-[11px]">0 of 4 complete</p>
              <p className="text-white/40 text-[10px] mt-1 italic">
                Complete Phase 1 to unlock Be Ecosystem mentoring
              </p>
            </PhoneCard>

            {/* Card 6: Legacy Path */}
            <PhoneCard delay={0.6}>
              <p className="text-white font-semibold text-sm mb-4">🌟 Your Journey at Ashford Manor</p>
              <div className="space-y-5 relative ml-3">
                <div className="absolute left-[5px] top-2 bottom-2 w-px" style={{ background: `${GOLD}40` }} />
                {[
                  { year: "NOW", title: "Sous Chef", desc: "Join the Ashford Manor kitchen", active: true },
                  { year: "YEAR 1", title: "Senior Sous Chef", desc: "Own your section. Lead preparation." },
                  { year: "YEAR 2", title: "Chef de Partie / Head of Section", desc: "Full creative ownership of your area" },
                  { year: "YEAR 3 ⭐", title: "Head Chef", desc: "Lead the entire kitchen operation" },
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-4 relative">
                    <div className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5 z-10" style={{ background: s.active ? GOLD : NAVY_LIGHT, border: `2px solid ${GOLD}` }} />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>{s.year}</p>
                      <p className="text-sm text-white font-semibold">{s.title}</p>
                      <p className="text-xs text-white/60">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-xl p-3 text-center" style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}>
                <p className="text-xs font-semibold" style={{ color: GOLD }}>Be Academy Mentoring • April 2026</p>
                <p className="text-[10px] text-white/50 mt-1">
                  Matched with a Head Chef mentor from the Be Ecosystem global network
                </p>
              </div>
            </PhoneCard>

            {/* Bottom spacer for phone */}
            <div className="h-4" />
          </div>

          {/* Phone home indicator */}
          <div className="flex justify-center py-2" style={{ background: NAVY }}>
            <div className="w-28 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
          </div>
        </div>
      </div>

      {/* Card 7: Anti-Ghosting Panel (outside phone) */}
      <div
        className="rounded-xl p-5 max-w-[500px] mx-auto"
        style={{ background: `${NAVY}15`, border: `1px solid ${NAVY}30` }}
      >
        <p className="text-sm font-semibold mb-3">🛡️ Anti-Ghosting Active</p>
        <p className="text-xs text-muted-foreground mb-3">
          Once James accepts, Be Connect automatically sends:
        </p>
        <div className="space-y-1.5 mb-4">
          {[
            "This welcome experience (instant)",
            "Safety Call prompt to manager (24hrs)",
            "Check-in after Shift 1",
            "Check-in after Shift 2",
            "Check-in after Shift 3",
            "Weekly pulse from Week 2",
          ].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs">
              <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: GOLD }} />
              <span className="text-muted-foreground">{item}</span>
            </div>
          ))}
        </div>
        <div className="rounded-lg p-3 mb-3" style={{ background: "rgba(234,179,8,0.1)", border: "1px solid rgba(234,179,8,0.2)" }}>
          <p className="text-xs font-medium">
            Current ghosting risk: <span style={{ color: GOLD }}>🟡 MODERATE</span> — Offer pending 1 day
          </p>
          <p className="text-[11px] text-muted-foreground mt-1 italic">"Send a personal message today"</p>
        </div>
        <Button size="sm" className="w-full text-xs font-semibold" style={{ background: GOLD, color: "#000" }}>
          Send Check-In Now
        </Button>
      </div>
    </div>
  );
}
