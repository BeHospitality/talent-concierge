import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, AlertTriangle, User, MapPin, Brain, Building2, Globe, Briefcase, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ARCHETYPE_CONFIG: Record<string, { emoji: string; label: string; tagline: string }> = {
  lion: { emoji: "🦁", label: "Lion", tagline: "Natural leader, high autonomy, results-driven" },
  whale: { emoji: "🐋", label: "Whale", tagline: "Team player, collaborative, relationship-focused" },
  falcon: { emoji: "🦅", label: "Falcon", tagline: "Detail-oriented, precise, quality-driven" },
};

export default function DossierPublicView() {
  const { code } = useParams<{ code: string }>();
  const [pin, setPin] = useState(["", "", "", "", "", ""]);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [dossierId, setDossierId] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check dossier exists via public view (no PIN exposed)
  const { data: dossierMeta, isLoading, error: fetchError } = useQuery({
    queryKey: ["public_dossier_meta", code],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_dossiers")
        .select("id, candidate_id, status, department, role, expires_at, organization_id")
        .eq("unique_code", code!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!code,
  });

  // Load full dossier content after PIN verification
  const { data: dossierContent } = useQuery({
    queryKey: ["dossier_content", dossierId],
    queryFn: async () => {
      // Get candidate info via public_dossiers join
      const { data: dossier } = await supabase
        .from("public_dossiers")
        .select("id, candidate_id, department, role, manager_notes, organization_id, include_resume, resume_url, resume_filename")
        .eq("id", dossierId!)
        .single();
      if (!dossier) return null;

      // Get candidate basic info (name, location) - use candidates_safe for privacy
      const { data: candidate } = await supabase
        .from("candidates_safe")
        .select("id, full_name")
        .eq("id", dossier.candidate_id!)
        .single();

      // Get prescreening data
      const { data: prescreening } = await supabase
        .from("prescreening_data")
        .select("tribe_viral_archetype, dimension_scores, sector_matches, geography_matches, department_matches")
        .eq("candidate_id", dossier.candidate_id!)
        .single();

      return { dossier, candidate, prescreening };
    },
    enabled: !!dossierId && verified,
  });

  useEffect(() => {
    if (dossierMeta && !verified) inputRefs.current[0]?.focus();
  }, [dossierMeta, verified]);

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...pin];
    next[index] = value;
    setPin(next);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...pin];
    for (let i = 0; i < 6; i++) next[i] = pasted[i] || "";
    setPin(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  };

  const handleVerify = async () => {
    const fullPin = pin.join("");
    if (fullPin.length < 6) { setError("Please enter the full 6-digit PIN"); return; }
    if (attempts >= 3) { setError("Too many attempts. Please contact your recruiter."); return; }

    setVerifying(true);
    try {
      const { data } = await supabase.rpc("verify_dossier_pin", {
        p_unique_code: code!,
        p_pin: fullPin,
      });

      const result = data as unknown as { valid: boolean; id: string | null };

      if (result?.valid) {
        setVerified(true);
        setDossierId(result.id);
        // Track view
        await supabase.rpc("track_dossier_view", { p_dossier_id: result.id! });
      } else {
        setAttempts((a) => a + 1);
        setError(`Incorrect PIN. ${3 - attempts - 1} attempts remaining.`);
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setError("Verification failed. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const fullPin = pin.join("");
    if (fullPin.length === 6 && !verifying) handleVerify();
  }, [pin]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-bold text-sm">B</span>
        </div>
      </div>
    );
  }

  // Dossier not found
  if (fetchError || !dossierMeta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-8 max-w-md w-full text-center">
          <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Dossier Not Found</h1>
          <p className="text-sm text-muted-foreground">
            This dossier link is invalid or has expired. Please contact your recruiter for a new link.
          </p>
        </motion.div>
      </div>
    );
  }

  // PIN entry
  if (!verified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-1">Candidate Dossier</h1>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit PIN sent to you to view this dossier.
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
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
                className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-border bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                disabled={attempts >= 3}
              />
            ))}
          </div>

          {error && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-destructive text-sm text-center mb-4 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> {error}
            </motion.p>
          )}

          <Button onClick={handleVerify} className="w-full" disabled={pin.join("").length < 6 || verifying || attempts >= 3}>
            {verifying ? "Verifying…" : "Access Dossier"}
          </Button>

          <div className="flex items-center justify-center gap-1 mt-4 text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3" /> PIN-protected · GDPR compliant
          </div>
        </motion.div>
      </div>
    );
  }

  // Dossier content
  const content = dossierContent;
  const candidateName = content?.candidate?.full_name || "Candidate";
  const archetype = content?.prescreening?.tribe_viral_archetype as string | undefined;
  const archetypeInfo = archetype ? ARCHETYPE_CONFIG[archetype] : null;
  const dimensions = content?.prescreening?.dimension_scores as unknown as Record<string, number> | null;
  const sectorMatches = content?.prescreening?.sector_matches as unknown as { sector: string; fitScore: number }[] | null;
  const geoMatches = content?.prescreening?.geography_matches as unknown as { region: string; fitScore: number }[] | null;
  const deptMatches = content?.prescreening?.department_matches as unknown as { department: string; fitScore: number }[] | null;

  const keyDimensions = dimensions
    ? [
        { name: "Autonomy", score: dimensions.autonomy || 0 },
        { name: "Collaboration", score: dimensions.collaboration || 0 },
        { name: "Precision", score: dimensions.precision || 0 },
        { name: "Adaptability", score: dimensions.adaptability || 0 },
        { name: "Leadership", score: dimensions.leadership || 0 },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">B</span>
            </div>
            <span className="font-semibold text-sm">Candidate Dossier</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3" /> Secure View
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Candidate Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{candidateName}</h1>
              {content?.dossier?.role && (
                <p className="text-muted-foreground">{content.dossier.role}{content.dossier.department ? ` · ${content.dossier.department}` : ""}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Archetype */}
        {archetypeInfo && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-primary" /> DNA Profile
            </h2>
            <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 border border-border/30 mb-6">
              <span className="text-5xl">{archetypeInfo.emoji}</span>
              <div>
                <p className="font-bold text-xl capitalize text-primary">{archetypeInfo.label} Archetype</p>
                <p className="text-sm text-muted-foreground">{archetypeInfo.tagline}</p>
              </div>
            </div>

            {/* Dimension scores */}
            {keyDimensions.length > 0 && (
              <div className="space-y-3">
                {keyDimensions.map((dim) => (
                  <div key={dim.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{dim.name}</span>
                      <span className="text-muted-foreground">{dim.score}%</span>
                    </div>
                    <Progress value={dim.score} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Sector & Geography Matches */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sectorMatches && sectorMatches.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" /> Sector Fit
              </h2>
              <div className="space-y-2">
                {sectorMatches.slice(0, 5).map((s, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span>{s.sector}</span>
                    <Badge variant="secondary" className="text-[10px]">{s.fitScore}%</Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {geoMatches && geoMatches.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4 text-primary" /> Geography Fit
              </h2>
              <div className="space-y-2">
                {geoMatches.slice(0, 5).map((g, i) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span>{g.region}</span>
                    <Badge variant="secondary" className="text-[10px]">{g.fitScore}%</Badge>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Department Matches */}
        {deptMatches && deptMatches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Department Fit
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {deptMatches.slice(0, 6).map((d, i) => (
                <div key={i} className="flex justify-between items-center text-sm p-2 rounded-lg bg-muted/30">
                  <span>{d.department}</span>
                  <Badge variant="secondary" className="text-[10px]">{d.fitScore}%</Badge>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground py-6">
          <p>This dossier is confidential and intended for the named recipient only.</p>
          <p className="flex items-center justify-center gap-1 mt-1">
            <ShieldCheck className="w-3 h-3" /> GDPR Compliant · Powered by BE Connect
          </p>
        </div>
      </div>
    </div>
  );
}
