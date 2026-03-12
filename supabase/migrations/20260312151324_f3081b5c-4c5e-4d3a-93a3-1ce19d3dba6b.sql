
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'candidate-videos';

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can view candidate videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload candidate videos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete candidate videos" ON storage.objects;

-- Admins and concierges can read all videos in the bucket
CREATE POLICY "Authorized users can view candidate videos" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'candidate-videos'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'concierge'::public.app_role)
    )
  );

-- Admins and concierges can upload videos
CREATE POLICY "Authorized users can upload candidate videos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'candidate-videos'
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'concierge'::public.app_role)
    )
  );

-- Admins can delete videos
CREATE POLICY "Admins can delete candidate videos" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'candidate-videos'
    AND public.has_role(auth.uid(), 'admin'::public.app_role)
  );
