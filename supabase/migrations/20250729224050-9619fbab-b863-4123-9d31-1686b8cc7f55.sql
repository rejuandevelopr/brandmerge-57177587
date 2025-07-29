-- Additional cleanup: Reset any error status brand profiles
UPDATE brand_profiles 
SET qloo_analysis_status = 'not_analyzed', 
    last_qloo_sync = NULL
WHERE qloo_analysis_status = 'error';

-- Check if unique constraint already exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'brand_qloo_analyses_brand_profile_id_unique'
        AND table_name = 'brand_qloo_analyses'
    ) THEN
        ALTER TABLE brand_qloo_analyses 
        ADD CONSTRAINT brand_qloo_analyses_brand_profile_id_unique 
        UNIQUE (brand_profile_id);
    END IF;
END
$$;