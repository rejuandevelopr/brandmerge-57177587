-- Delete stuck analyzing records instead of updating to invalid status
DELETE FROM brand_qloo_analyses WHERE status = 'analyzing';

-- Reset brand profiles stuck in analyzing  
UPDATE brand_profiles 
SET qloo_analysis_status = 'not_analyzed'
WHERE qloo_analysis_status = 'analyzing';