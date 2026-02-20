
-- Add churn prediction cache columns to journey_blueprints
ALTER TABLE public.journey_blueprints 
ADD COLUMN IF NOT EXISTS churn_prediction JSONB,
ADD COLUMN IF NOT EXISTS churn_updated_at TIMESTAMP WITH TIME ZONE;
