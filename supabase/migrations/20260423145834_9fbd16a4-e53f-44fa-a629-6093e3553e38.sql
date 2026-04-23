-- Backfill DNA dimensional + match data from matching_results JSONB
-- into dedicated columns for any prescreening_data row that has rich
-- matching_results but empty dedicated columns.

UPDATE prescreening_data
SET
  dimension_scores = COALESCE(dimension_scores, matching_results->'comprehensiveScores'),
  sector_matches = CASE
    WHEN sector_matches IS NULL AND jsonb_typeof(matching_results->'sectorMatches') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements(matching_results->'sectorMatches')::text)
    ELSE sector_matches
  END,
  department_matches = CASE
    WHEN department_matches IS NULL AND jsonb_typeof(matching_results->'departmentMatches') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements(matching_results->'departmentMatches')::text)
    ELSE department_matches
  END,
  geography_matches = CASE
    WHEN geography_matches IS NULL AND jsonb_typeof(matching_results->'geographyMatches') = 'array'
    THEN ARRAY(SELECT jsonb_array_elements(matching_results->'geographyMatches')::text)
    ELSE geography_matches
  END,
  tribe_viral_scores = CASE
    WHEN tribe_viral_scores IS NULL AND tribe_viral_archetype IS NOT NULL AND matching_results->'comprehensiveScores' IS NOT NULL
    THEN jsonb_build_object(tribe_viral_archetype::text, 100)
    ELSE tribe_viral_scores
  END
WHERE matching_results IS NOT NULL
  AND (
    dimension_scores IS NULL
    OR sector_matches IS NULL
    OR department_matches IS NULL
    OR geography_matches IS NULL
  );