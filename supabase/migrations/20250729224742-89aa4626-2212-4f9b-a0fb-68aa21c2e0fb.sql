-- First, let's check which tables have the update trigger
SELECT 
    t.trigger_name,
    t.event_object_table,
    t.action_statement
FROM information_schema.triggers t
WHERE t.action_statement LIKE '%update_updated_at_column%';

-- Remove the trigger from brand_qloo_analyses since it doesn't have updated_at column
DROP TRIGGER IF EXISTS update_brand_qloo_analyses_updated_at ON brand_qloo_analyses;