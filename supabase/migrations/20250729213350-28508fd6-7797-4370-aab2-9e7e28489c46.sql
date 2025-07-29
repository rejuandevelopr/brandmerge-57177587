-- Create table for storing Qloo analysis results
CREATE TABLE public.brand_qloo_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_profile_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
  similar_brands JSONB,
  overlap_scores JSONB,
  analysis_timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'completed', 'error')),
  error_message TEXT,
  UNIQUE(brand_profile_id)
);

-- Enable RLS on the new table
ALTER TABLE public.brand_qloo_analyses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for brand_qloo_analyses
CREATE POLICY "Users can view their own brand analyses" 
ON public.brand_qloo_analyses 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.brand_profiles 
    WHERE brand_profiles.id = brand_qloo_analyses.brand_profile_id 
    AND brand_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create analyses for their own brands" 
ON public.brand_qloo_analyses 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.brand_profiles 
    WHERE brand_profiles.id = brand_qloo_analyses.brand_profile_id 
    AND brand_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own brand analyses" 
ON public.brand_qloo_analyses 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.brand_profiles 
    WHERE brand_profiles.id = brand_qloo_analyses.brand_profile_id 
    AND brand_profiles.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own brand analyses" 
ON public.brand_qloo_analyses 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.brand_profiles 
    WHERE brand_profiles.id = brand_qloo_analyses.brand_profile_id 
    AND brand_profiles.user_id = auth.uid()
  )
);

-- Add fields to brand_profiles for Qloo status tracking
ALTER TABLE public.brand_profiles 
ADD COLUMN qloo_analysis_status TEXT DEFAULT 'not_analyzed' CHECK (qloo_analysis_status IN ('not_analyzed', 'pending', 'analyzing', 'completed', 'error')),
ADD COLUMN last_qloo_sync TIMESTAMP WITH TIME ZONE;

-- Create trigger for automatic timestamp updates on brand_qloo_analyses
CREATE TRIGGER update_brand_qloo_analyses_updated_at
BEFORE UPDATE ON public.brand_qloo_analyses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();