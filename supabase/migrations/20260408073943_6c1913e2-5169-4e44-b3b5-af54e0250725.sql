UPDATE candidates
SET video_clips = jsonb_build_array(
  jsonb_build_object(
    'id', gen_random_uuid()::text,
    'title', 'Introduction',
    'url', 'https://xctvbnccqqvviycsuygu.supabase.co/storage/v1/object/public/candidate-videos/aaronmcgovern191-gmail-com/1775594743193-introduction.mp4',
    'uploaded_at', '2026-04-07T20:46:10Z'
  )
)
WHERE id = 'e97dfb05-a7d3-4c18-9f31-3f50aa65e150'
  AND (video_clips IS NULL OR video_clips = '[]'::jsonb);