import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { Lock, ShieldCheck, AlertTriangle, FileText, Download, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DossierHero } from "@/components/dossier/DossierHero";
import { DossierDNAProfile } from "@/components/dossier/DossierDNAProfile";
import { DossierStrengths } from "@/components/dossier/DossierStrengths";
import { DossierRoleFit } from "@/components/dossier/DossierRoleFit";
import { DossierWorkingStyle } from "@/components/dossier/DossierWorkingStyle";
import { DossierRetention } from "@/components/dossier/DossierRetention";
import { getTopStrengths } from "@/utils/dossierNarratives";

type DepartmentMatch = { department: string; fitScore?: number };
type GeographyMatch = { region: string; fitScore?: number };

const normalizeDimensions = (value: unknown): Record<string, number> => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, number>>((acc, [key, raw]) => {
    if (typeof raw === "number" && Number.isFinite(raw)) {
      acc[key] = raw;
    }
    return acc;
  }, {});
};

const normalizeDepartmentMatches = (value: unknown): DepartmentMatch[] => {
  if (!Array.isArray(value)) return [];

  const normalized: DepartmentMatch[] = [];

  value.forEach((item) => {
    if (typeof item === "string") {
      // Try parsing JSON strings like '{"department":"Kitchen","fitScore":67,"rank":1}'
      try {
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed === "object" && typeof parsed.department === "string") {
          normalized.push({ department: parsed.department, fitScore: typeof parsed.fitScore === "number" ? parsed.fitScore : undefined });
          return;
        }
      } catch {
        // Not JSON — treat as plain department name
      }
      if (item.trim()) normalized.push({ department: item.trim() });
      return;
    }

    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const department = typeof row.department === "string" ? row.department : "";
      const fitScore = typeof row.fitScore === "number" ? row.fitScore : undefined;
      if (department) normalized.push({ department, fitScore });
    }
  });

  return normalized.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
};

const normalizeGeographyMatches = (value: unknown): GeographyMatch[] => {
  if (!Array.isArray(value)) return [];

  const normalized: GeographyMatch[] = [];

  value.forEach((item) => {
    if (typeof item === "string") {
      try {
        const parsed = JSON.parse(item);
        if (parsed && typeof parsed === "object" && typeof parsed.region === "string") {
          normalized.push({ region: parsed.region, fitScore: typeof parsed.fitScore === "number" ? parsed.fitScore : undefined });
          return;
        }
      } catch {
        // Not JSON
      }
      if (item.trim()) normalized.push({ region: item.trim() });
      return;
    }

    if (item && typeof item === "object") {
      const row = item as Record<string, unknown>;
      const region = typeof row.region === "string" ? row.region : "";
      const fitScore = typeof row.fitScore === "number" ? row.fitScore : undefined;
      if (region) normalized.push({ region, fitScore });
    }
  });

  return normalized.sort((a, b) => (b.fitScore ?? 0) - (a.fitScore ?? 0));
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

  const { data: dossierContent } = useQuery({
    queryKey: ["dossier_content", dossierId],
    queryFn: async () => {
      const { data: dossier } = await supabase
        .from("public_dossiers")
        .select("id, candidate_id, department, role, manager_notes, organization_id, include_resume, resume_url, resume_filename")
        .eq("id", dossierId!)
        .single();
      if (!dossier) return null;

      const { data: candidate } = await supabase
        .from("candidates_safe")
        .select("id, full_name")
        .eq("id", dossier.candidate_id!)
        .single();

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
      const { data, error: verifyError } = await supabase.rpc("verify_dossier_pin", {
        p_unique_code: code!,
        p_pin: fullPin,
      });

      if (verifyError) throw verifyError;

      const result = data as unknown as { valid: boolean; id: string | null };

      if (result?.valid) {
        setVerified(true);
        setDossierId(result.id);
        await supabase.rpc("track_dossier_view", { p_dossier_id: result.id! });
      } else {
        setAttempts((a) => a + 1);
        setError(`Incorrect PIN. ${3 - attempts - 1} attempts remaining.`);
        setPin(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      const message = err?.message?.includes("Too many attempts")
        ? "Too many attempts. Please try again later."
        : err?.message || "Verification failed. Please try again.";
      setError(message);
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    const fullPin = pin.join("");
    if (fullPin.length === 6 && !verifying) handleVerify();
  }, [pin]);

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center animate-pulse">
          <span className="text-primary-foreground font-bold text-sm">B</span>
        </div>
      </div>
    );
  }

  // Not found
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

  // ─── Dossier Content ───────────────────────────────────────
  const content = dossierContent;
  const candidateName = content?.candidate?.full_name || "Candidate";
  const archetype = content?.prescreening?.tribe_viral_archetype as string | undefined;
  const dimensions = normalizeDimensions(content?.prescreening?.dimension_scores);
  const deptMatches = normalizeDepartmentMatches(content?.prescreening?.department_matches);
  const geoMatches = normalizeGeographyMatches(content?.prescreening?.geography_matches);

  const strengths = getTopStrengths(dimensions, 3);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
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

      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Hero */}
        <DossierHero
          candidateName={candidateName}
          role={content?.dossier?.role}
          department={content?.dossier?.department}
          archetype={archetype}
        />

        {/* DNA Profile — second section, before strengths */}
        <DossierDNAProfile
          archetype={archetype}
          archetypeName={(content?.prescreening as any)?.archetype_type}
          dimensions={dimensions}
          sectorMatchesRaw={(content?.prescreening as any)?.sector_matches}
          departmentMatchesRaw={content?.prescreening?.department_matches}
          geographyMatchesRaw={content?.prescreening?.geography_matches}
          completedAt={(content?.prescreening as any)?.completed_at}
        />

        {/* Strengths & Traits */}
        <DossierStrengths strengths={strengths} />

        {/* Working Style */}
        {Object.keys(dimensions).length > 0 && (
          <DossierWorkingStyle archetype={archetype} dimensions={dimensions} />
        )}

        {/* Recommended Roles */}
        {deptMatches && deptMatches.length > 0 && (
          <DossierRoleFit
            candidateName={candidateName}
            departments={deptMatches}
            archetype={archetype}
            dimensions={dimensions}
          />
        )}

        {/* Retention Insights */}
        {Object.keys(dimensions).length > 0 && (
          <DossierRetention archetype={archetype} dimensions={dimensions} />
        )}

        {/* Geography - subtle inline */}
        {geoMatches && geoMatches.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="flex items-center gap-2 text-xs text-muted-foreground px-1">
            <Globe className="w-3.5 h-3.5" />
            <span>Also well-suited for: {geoMatches.slice(0, 3).map((g) => g.region).join(", ")}</span>
          </motion.div>
        )}

        {/* Resume Download */}
        {content?.dossier?.include_resume && content?.dossier?.resume_url && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Candidate CV
            </h2>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/30">
              <FileText className="w-10 h-10 text-primary/70 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{content.dossier.resume_filename || "Resume"}</p>
              </div>
              <Button
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  const a = document.createElement("a");
                  a.href = content.dossier!.resume_url!;
                  a.download = content.dossier!.resume_filename || "resume";
                  a.target = "_blank";
                  a.rel = "noopener noreferrer";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
              >
                <Download className="w-3.5 h-3.5" /> Download
              </Button>
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
