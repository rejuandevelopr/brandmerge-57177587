-- Clean up stuck analyzing records
UPDATE brand_qloo_analyses 
SET status = 'failed', 
    error_message = 'Analysis was stuck in analyzing state - cleared automatically',
    last_updated = now()
WHERE status = 'analyzing';

-- Reset brand profiles stuck in analyzing
UPDATE brand_profiles 
SET qloo_analysis_status = 'not_analyzed',
    updated_at = now()
WHERE qloo_analysis_status = 'analyzing';