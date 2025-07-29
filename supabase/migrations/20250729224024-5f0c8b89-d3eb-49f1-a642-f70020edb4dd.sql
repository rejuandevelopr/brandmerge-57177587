-- Additional cleanup: Reset any error status brand profiles
UPDATE brand_profiles 
SET qloo_analysis_status = 'not_analyzed', 
    last_qloo_sync = NULL
WHERE qloo_analysis_status = 'error';

-- Ensure unique constraint exists on brand_qloo_analyses
ALTER TABLE brand_qloo_analyses 
ADD CONSTRAINT IF NOT EXISTS brand_qloo_analyses_brand_profile_id_unique 
UNIQUE (brand_profile_id);