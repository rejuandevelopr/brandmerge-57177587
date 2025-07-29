-- Clean up stuck analyzing records and reset brand profile status
DELETE FROM brand_qloo_analyses WHERE status = 'analyzing';

UPDATE brand_profiles 
SET qloo_analysis_status = 'not_analyzed' 
WHERE qloo_analysis_status = 'analyzing';