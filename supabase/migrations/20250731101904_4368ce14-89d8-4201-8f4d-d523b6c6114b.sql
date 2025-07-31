-- Create table for trending startups discovered through Google Custom Search
CREATE TABLE public.trending_startups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  growth_indicators JSONB,
  partnership_signals JSONB,
  cultural_markers TEXT[],
  funding_status TEXT,
  source_url TEXT,
  discovered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  qloo_alignment_score NUMERIC,
  opportunity_score NUMERIC,
  is_active BOOLEAN DEFAULT true
);

-- Create table for partnership news and collaboration intelligence
CREATE TABLE public.partnership_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_1 TEXT NOT NULL,
  brand_2 TEXT NOT NULL,
  collaboration_type TEXT,
  announcement_date TIMESTAMP WITH TIME ZONE,
  industry_tags TEXT[],
  success_indicators JSONB,
  source_url TEXT,
  summary TEXT,
  relevance_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for tracking data refresh operations
CREATE TABLE public.data_refresh_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_type TEXT NOT NULL,
  search_query TEXT,
  results_count INTEGER DEFAULT 0,
  success_rate NUMERIC,
  last_refresh TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'success',
  error_message TEXT
);

-- Enable RLS on new tables
ALTER TABLE public.trending_startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_refresh_log ENABLE ROW LEVEL SECURITY;

-- Create policies for trending_startups (public read, admin write)
CREATE POLICY "Everyone can view trending startups" 
ON public.trending_startups 
FOR SELECT 
USING (true);

-- Create policies for partnership_news (public read, admin write)
CREATE POLICY "Everyone can view partnership news" 
ON public.partnership_news 
FOR SELECT 
USING (true);

-- Create policies for data_refresh_log (admin only)
CREATE POLICY "Authenticated users can view refresh logs" 
ON public.data_refresh_log 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_trending_startups_industry ON public.trending_startups(industry);
CREATE INDEX idx_trending_startups_opportunity_score ON public.trending_startups(opportunity_score DESC);
CREATE INDEX idx_trending_startups_discovered_at ON public.trending_startups(discovered_at DESC);
CREATE INDEX idx_partnership_news_announcement_date ON public.partnership_news(announcement_date DESC);
CREATE INDEX idx_partnership_news_industry_tags ON public.partnership_news USING GIN(industry_tags);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_trending_startups_updated_at
BEFORE UPDATE ON public.trending_startups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_partnership_news_updated_at
BEFORE UPDATE ON public.partnership_news
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();