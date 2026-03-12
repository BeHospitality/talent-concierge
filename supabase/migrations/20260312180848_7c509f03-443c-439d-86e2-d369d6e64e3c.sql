
-- Add resume metadata columns
ALTER TABLE public.candidates 
ADD COLUMN IF NOT EXISTS resume_filename TEXT,
ADD COLUMN IF NOT EXISTS resume_uploaded_at TIMESTAMPTZ;

-- Create candidate-resumes storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('candidate-resumes', 'candidate-resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload
CREATE POLICY "Authenticated users can upload resumes"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'candidate-resumes');

-- Authenticated users can read resumes for their org candidates
CREATE POLICY "Users can read resumes"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'candidate-resumes');

-- Authenticated users can update (replace) resumes
CREATE POLICY "Users can update resumes"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'candidate-resumes');

-- Authenticated users can delete resumes
CREATE POLICY "Users can delete resumes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'candidate-resumes');
