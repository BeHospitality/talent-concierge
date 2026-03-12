import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Download, Trash2, RefreshCw } from "lucide-react";
import { format } from "date-fns";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface Props {
  candidateId: string;
}

export function ResumeUploadSection({ candidateId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: resume, isLoading } = useQuery({
    queryKey: ["candidate-resume", candidateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("candidates")
        .select("resume_url, resume_filename, resume_uploaded_at")
        .eq("id", candidateId)
        .single();
      if (error) throw error;
      return data as { resume_url: string | null; resume_filename: string | null; resume_uploaded_at: string | null };
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Only PDF and Word documents are allowed");
      }
      if (file.size > MAX_SIZE) {
        throw new Error("File size must be under 5MB");
      }

      setUploading(true);
      setProgress(20);

      const ext = file.name.split(".").pop();
      const filePath = `${candidateId}/resume_${Date.now()}.${ext}`;

      setProgress(40);

      const { error: uploadError } = await supabase.storage
        .from("candidate-resumes")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      setProgress(70);

      // Get signed URL for private bucket
      const { data: signedData } = await supabase.storage
        .from("candidate-resumes")
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 year

      const url = signedData?.signedUrl ?? filePath;

      const { error: updateError } = await supabase
        .from("candidates")
        .update({
          resume_url: filePath, // store the path, not signed URL
          resume_filename: file.name,
          resume_uploaded_at: new Date().toISOString(),
        } as any)
        .eq("id", candidateId);

      if (updateError) throw updateError;

      setProgress(100);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-resume", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Resume uploaded", description: "CV/Resume has been saved successfully." });
      setUploading(false);
      setProgress(0);
    },
    onError: (error: any) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
      setUploading(false);
      setProgress(0);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (resume?.resume_url) {
        await supabase.storage
          .from("candidate-resumes")
          .remove([resume.resume_url]);
      }

      const { error } = await supabase
        .from("candidates")
        .update({
          resume_url: null,
          resume_filename: null,
          resume_uploaded_at: null,
        } as any)
        .eq("id", candidateId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-resume", candidateId] });
      queryClient.invalidateQueries({ queryKey: ["candidates"] });
      toast({ title: "Resume removed" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleDownload = async () => {
    if (!resume?.resume_url) return;

    const { data, error } = await supabase.storage
      .from("candidate-resumes")
      .download(resume.resume_url);

    if (error) {
      toast({ title: "Download failed", description: error.message, variant: "destructive" });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = resume.resume_filename ?? "resume";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const hasResume = resume?.resume_url && resume?.resume_filename;

  return (
    <div className="bg-card rounded-xl border border-border/50 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        CV / Resume
      </h2>

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={handleFileSelect}
      />

      {uploading && (
        <div className="mb-4">
          <p className="text-sm text-muted-foreground mb-2">Uploading...</p>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : hasResume ? (
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border border-border/30">
          <FileText className="w-10 h-10 text-primary/70 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{resume.resume_filename}</p>
            {resume.resume_uploaded_at && (
              <p className="text-xs text-muted-foreground">
                Uploaded {format(new Date(resume.resume_uploaded_at), "dd MMM yyyy 'at' HH:mm")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button size="sm" variant="outline" className="gap-1.5" onClick={handleDownload}>
              <Download className="w-3.5 h-3.5" /> Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <RefreshCw className="w-3.5 h-3.5" /> Replace
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed border-border/50 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm font-medium">Click to upload CV/Resume</p>
          <p className="text-xs text-muted-foreground mt-1">PDF or Word documents · Max 5MB</p>
        </div>
      )}
    </div>
  );
}
