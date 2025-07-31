-- Add growth_opportunity_forecast column to brand_qloo_analyses table
ALTER TABLE brand_qloo_analyses 
ADD COLUMN growth_opportunity_forecasts jsonb DEFAULT '[]'::jsonb;