-- Add growth_opportunity_forecast column to brand_synergy_analyses table
ALTER TABLE public.brand_synergy_analyses 
ADD COLUMN growth_opportunity_forecast TEXT;