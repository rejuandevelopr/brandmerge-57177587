-- Add brand count tracking to brand_match_analyses table
ALTER TABLE brand_match_analyses 
ADD COLUMN brand_count_requested INTEGER DEFAULT 15,
ADD COLUMN geographic_distribution JSONB DEFAULT '{"local": 0, "country": 0, "international": 0}'::jsonb;

-- Update existing records to have default values
UPDATE brand_match_analyses 
SET brand_count_requested = 15, 
    geographic_distribution = '{"local": 0, "country": 0, "international": 0}'::jsonb 
WHERE brand_count_requested IS NULL;