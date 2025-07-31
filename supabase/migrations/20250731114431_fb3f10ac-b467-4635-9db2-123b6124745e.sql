-- Create table for storing Google-sourced brand match analyses
CREATE TABLE public.brand_match_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id UUID NOT NULL,
  search_query TEXT NOT NULL,
  matched_brands JSONB NOT NULL DEFAULT '[]'::jsonb,
  search_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  analysis_status TEXT NOT NULL DEFAULT 'pending',
  match_count INTEGER DEFAULT 0,
  location_filter TEXT,
  industry_filter TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking analysis sessions
CREATE TABLE public.brand_analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id UUID NOT NULL,
  session_status TEXT NOT NULL DEFAULT 'pending',
  qloo_analysis_id UUID,
  match_analysis_id UUID,
  synergy_analysis_count INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_match_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_analysis_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for brand_match_analyses
CREATE POLICY "Users can view analyses for their brands" 
ON public.brand_match_analyses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_match_analyses.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create analyses for their brands" 
ON public.brand_match_analyses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_match_analyses.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their brand analyses" 
ON public.brand_match_analyses 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_match_analyses.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

-- Create policies for brand_analysis_sessions
CREATE POLICY "Users can view their analysis sessions" 
ON public.brand_analysis_sessions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_analysis_sessions.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create analysis sessions for their brands" 
ON public.brand_analysis_sessions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_analysis_sessions.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their analysis sessions" 
ON public.brand_analysis_sessions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_analysis_sessions.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

-- Create triggers for updated_at
CREATE TRIGGER update_brand_match_analyses_updated_at
  BEFORE UPDATE ON public.brand_match_analyses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_analysis_sessions_updated_at
  BEFORE UPDATE ON public.brand_analysis_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();