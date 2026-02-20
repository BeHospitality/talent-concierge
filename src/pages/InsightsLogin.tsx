import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InsightsLogin() {
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();
  const [pin, setPin] = useState(["", "", "", ""]);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data: dossier, isLoading, error: fetchError } = useQuery({
    queryKey: ["insight_report_login", accessCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_reports")
        .select("id, property_name, manager_name, pin, status, created_at")
        .eq("access_code", accessCode!)
        .eq("status", "published")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!accessCode,
  });

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, [dossier]);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError("");
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter" && pin.every(d => d)) {
      handleVerify();
    }
  };

  const handleVerify = async () => {
    if (attempts >= 3 || !dossier) return;
    const entered = pin.join("");
    setVerifying(true);

    if (entered === dossier.pin) {
      // Track view
      const isFirst = !dossier.status; // we'll update via supabase
      await supabase
        .from("insight_reports")
        .update({
          first_viewed_at: dossier.id ? new Date().toISOString() : undefined,
          view_count: (dossier as any).view_count ? (dossier as any).view_count + 1 : 1,
        })
        .eq("id", dossier.id);

      localStorage.setItem(`insight_${accessCode}`, JSON.stringify({ id: dossier.id, ts: Date.now() }));
      navigate(`/insights/${accessCode}/report`);
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setPin(["", "", "", ""]);
      inputRefs.current[0]?.focus();
      if (next >= 3) {
        setError("Too many attempts. Contact hello@be.ie");
      } else {
        setError(`Incorrect PIN. ${3 - next} attempt${3 - next > 1 ? "s" : ""} remaining.`);
      }
    }
    setVerifying(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-radial flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-bold text-sm">B</span>
        </div>
      </div>
    );
  }

  if (fetchError || !dossier) {
    return (
      <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-muted-foreground" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Report Not Available</h1>
          <p className="text-muted-foreground text-sm">
            This report may have been archived or the link is invalid. Contact hello@be.ie for assistance.
          </p>
        </motion.div>
      </div>
    );
  }

  const locked = attempts >= 3;

  return (
    <div className="min-h-screen bg-gradient-radial flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-10">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="text-primary-foreground font-bold text-sm">B</span>
          </div>
          <p className="text-xs font-semibold tracking-[0.3em] uppercase text-primary mb-1">be connect</p>
        </div>

        <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-muted-foreground mb-3">
              Confidential Report
            </p>
            <h1 className="text-xl font-bold mb-1">{dossier.property_name}</h1>
            <p className="text-lg text-foreground/80">Team Insights</p>
            <p className="text-sm text-muted-foreground mt-2">
              Prepared exclusively for <span className="font-medium text-foreground">{dossier.manager_name}</span>
            </p>
          </div>

          {locked ? (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
              <AlertTriangle className="w-5 h-5 text-destructive mx-auto mb-2" />
              <p className="text-sm font-medium text-destructive">Too many attempts</p>
              <p className="text-xs text-muted-foreground mt-1">Contact hello@be.ie</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-center text-muted-foreground mb-4">Enter your secure PIN</p>
              <div className="flex justify-center gap-3 mb-4">
                {pin.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigit(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className="w-14 h-14 text-center text-2xl font-bold rounded-xl bg-muted/50 border border-border/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground"
                  />
                ))}
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive text-center mb-4"
                >
                  {error}
                </motion.p>
              )}

              <Button
                onClick={handleVerify}
                disabled={!pin.every(d => d) || verifying}
                className="w-full gap-2 gold-glow-hover"
              >
                <ShieldCheck className="w-4 h-4" />
                {verifying ? "Verifying…" : "Access Report"}
              </Button>
            </>
          )}
        </div>

        <div className="text-center mt-8 space-y-1">
          <p className="text-xs text-muted-foreground">
            This report was prepared by the Be Connect team on{" "}
            {new Date(dossier.created_at).toLocaleDateString("en-IE", { day: "numeric", month: "long", year: "numeric" })}.
          </p>
          <p className="text-xs text-muted-foreground">
            Questions?{" "}
            <a href="mailto:hello@be.ie" className="text-primary hover:underline">hello@be.ie</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
