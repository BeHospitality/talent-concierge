ALTER TABLE prescreening_data
ADD COLUMN IF NOT EXISTS dimension_scores JSONB,
ADD COLUMN IF NOT EXISTS sector_matches TEXT[],
ADD COLUMN IF NOT EXISTS geography_matches TEXT[],
ADD COLUMN IF NOT EXISTS department_matches TEXT[];