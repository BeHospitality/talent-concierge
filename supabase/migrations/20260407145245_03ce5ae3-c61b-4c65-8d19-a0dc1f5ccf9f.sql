ALTER TABLE prescreening_data ADD COLUMN IF NOT EXISTS ethics_signed boolean DEFAULT false;
ALTER TABLE prescreening_data ADD COLUMN IF NOT EXISTS ethics_signed_at timestamptz;
ALTER TABLE prescreening_data ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE prescreening_data ADD COLUMN IF NOT EXISTS video_uploaded_at timestamptz;
ALTER TABLE prescreening_data ADD COLUMN IF NOT EXISTS portal_source text;