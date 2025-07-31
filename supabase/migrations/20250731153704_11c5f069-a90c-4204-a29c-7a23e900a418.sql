-- Create brand_analysis_history table to track changes over time
CREATE TABLE public.brand_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id UUID NOT NULL,
  analysis_type TEXT NOT NULL, -- 'qloo', 'gpt_synergy', 'discovery'
  analysis_data JSONB NOT NULL,
  overlap_scores JSONB,
  match_count INTEGER DEFAULT 0,
  analysis_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_location_insights table for geo-specific data
CREATE TABLE public.brand_location_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id UUID NOT NULL,
  matched_brand_name TEXT NOT NULL,
  distance_km NUMERIC,
  location_relevance_score NUMERIC DEFAULT 0,
  same_city BOOLEAN DEFAULT false,
  same_country BOOLEAN DEFAULT false,
  collaboration_potential TEXT, -- 'high', 'medium', 'low'
  local_opportunities JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create brand_trend_analytics table for trend tracking
CREATE TABLE public.brand_trend_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id UUID NOT NULL,
  matched_brand_name TEXT NOT NULL,
  trend_direction TEXT NOT NULL DEFAULT 'stable', -- 'rising', 'falling', 'stable'
  trend_percentage NUMERIC DEFAULT 0,
  previous_score NUMERIC,
  current_score NUMERIC,
  trend_analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing brand_match_analyses table
ALTER TABLE public.brand_match_analyses 
ADD COLUMN geo_priority_score NUMERIC DEFAULT 0,
ADD COLUMN trend_direction TEXT DEFAULT 'stable',
ADD COLUMN location_relevance_score NUMERIC DEFAULT 0,
ADD COLUMN analysis_staleness_hours INTEGER DEFAULT 0;

-- Add new columns to existing brand_profiles table for location tracking
ALTER TABLE public.brand_profiles 
ADD COLUMN latitude NUMERIC,
ADD COLUMN longitude NUMERIC,
ADD COLUMN timezone TEXT,
ADD COLUMN market_region TEXT;

-- Enable RLS on new tables
ALTER TABLE public.brand_analysis_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_location_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_trend_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_analysis_history
CREATE POLICY "Users can view their brand analysis history" 
ON public.brand_analysis_history 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_analysis_history.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create analysis history for their brands" 
ON public.brand_analysis_history 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_analysis_history.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

-- Create RLS policies for brand_location_insights
CREATE POLICY "Users can view their brand location insights" 
ON public.brand_location_insights 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_location_insights.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create location insights for their brands" 
ON public.brand_location_insights 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_location_insights.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their brand location insights" 
ON public.brand_location_insights 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_location_insights.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

-- Create RLS policies for brand_trend_analytics
CREATE POLICY "Users can view their brand trend analytics" 
ON public.brand_trend_analytics 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_trend_analytics.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create trend analytics for their brands" 
ON public.brand_trend_analytics 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_trend_analytics.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their brand trend analytics" 
ON public.brand_trend_analytics 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_trend_analytics.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

-- Create function to calculate distance between two points
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 NUMERIC, lon1 NUMERIC, lat2 NUMERIC, lon2 NUMERIC
) RETURNS NUMERIC AS $$
BEGIN
  -- Haversine formula for calculating distance between two lat/lng points
  RETURN (
    6371 * acos(
      cos(radians(lat1)) * cos(radians(lat2)) * 
      cos(radians(lon2) - radians(lon1)) + 
      sin(radians(lat1)) * sin(radians(lat2))
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to determine trend direction
CREATE OR REPLACE FUNCTION public.calculate_trend_direction(
  previous_score NUMERIC, current_score NUMERIC
) RETURNS TEXT AS $$
BEGIN
  IF previous_score IS NULL THEN
    RETURN 'stable';
  END IF;
  
  IF current_score > previous_score + 5 THEN
    RETURN 'rising';
  ELSIF current_score < previous_score - 5 THEN
    RETURN 'falling';
  ELSE
    RETURN 'stable';
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update timestamps
CREATE TRIGGER update_brand_location_insights_updated_at
BEFORE UPDATE ON public.brand_location_insights
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();