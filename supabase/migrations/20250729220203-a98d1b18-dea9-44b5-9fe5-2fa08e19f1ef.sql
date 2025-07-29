-- Add GPT synergy status and timestamp to brand_profiles table
ALTER TABLE public.brand_profiles 
ADD COLUMN gpt_synergy_status TEXT DEFAULT 'not_analyzed',
ADD COLUMN last_gpt_sync TIMESTAMP WITH TIME ZONE;

-- Create brand_synergy_analyses table
CREATE TABLE public.brand_synergy_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id UUID NOT NULL,
  compared_brand_name TEXT NOT NULL,
  compared_brand_category TEXT,
  synergy_summary TEXT,
  collab_ideas JSONB,
  pitch_line TEXT,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  gpt_analysis_status TEXT NOT NULL DEFAULT 'pending',
  qloo_overlap_score NUMERIC,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.brand_synergy_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_synergy_analyses
CREATE POLICY "Users can view their own brand synergy analyses" 
ON public.brand_synergy_analyses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_synergy_analyses.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create synergy analyses for their own brands" 
ON public.brand_synergy_analyses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_synergy_analyses.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their own brand synergy analyses" 
ON public.brand_synergy_analyses 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_synergy_analyses.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

CREATE POLICY "Users can delete their own brand synergy analyses" 
ON public.brand_synergy_analyses 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM brand_profiles 
  WHERE brand_profiles.id = brand_synergy_analyses.brand_profile_id 
  AND brand_profiles.user_id = auth.uid()
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_brand_synergy_analyses_updated_at
BEFORE UPDATE ON public.brand_synergy_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();