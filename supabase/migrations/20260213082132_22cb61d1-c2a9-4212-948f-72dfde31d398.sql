
-- Add video_clips JSONB column to candidates table
ALTER TABLE public.candidates ADD COLUMN video_clips jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for candidate videos
INSERT INTO storage.buckets (id, name, public) VALUES ('candidate-videos', 'candidate-videos', true);

-- Storage policies for candidate videos
CREATE POLICY "Authenticated users can upload candidate videos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'candidate-videos' AND (SELECT auth.role()) = 'authenticated');

CREATE POLICY "Anyone can view candidate videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-videos');

CREATE POLICY "Authenticated users can delete candidate videos"
ON storage.objects FOR DELETE
USING (bucket_id = 'candidate-videos' AND (SELECT auth.role()) = 'authenticated');
