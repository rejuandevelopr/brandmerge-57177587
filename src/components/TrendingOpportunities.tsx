import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, ExternalLink, Target, Clock, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TrendingStartup {
  id: string;
  company_name: string;
  industry: string;
  description: string;
  growth_indicators: string[];
  partnership_signals: string[];
  cultural_markers: string[];
  funding_status: string;
  source_url: string;
  opportunity_score: number;
  discovered_at: string;
}

interface PartnershipNews {
  id: string;
  brand_1: string;
  brand_2: string;
  collaboration_type: string;
  industry_tags: string[];
  summary: string;
  relevance_score: number;
  source_url: string;
  announcement_date: string;
}

interface TrendingOpportunitiesProps {
  brandProfileId: string;
  brandName: string;
  brandIndustry?: string;
}

export default function TrendingOpportunities({ brandProfileId, brandName, brandIndustry }: TrendingOpportunitiesProps) {
  const [trendingStartups, setTrendingStartups] = useState<TrendingStartup[]>([]);
  const [partnershipNews, setPartnershipNews] = useState<PartnershipNews[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTrendingData();
  }, [brandProfileId]);

  const fetchTrendingData = async () => {
    try {
      // Fetch trending startups
      const { data: startups, error: startupsError } = await supabase
        .from('trending_startups')
        .select('*')
        .eq('is_active', true)
        .order('opportunity_score', { ascending: false })
        .limit(10);

      if (startupsError) {
        console.error('Error fetching trending startups:', startupsError);
      } else {
        // Transform the data to match our interface
        const transformedStartups = (startups || []).map(startup => ({
          ...startup,
          growth_indicators: Array.isArray(startup.growth_indicators) 
            ? startup.growth_indicators as string[]
            : startup.growth_indicators ? [startup.growth_indicators as string] : [],
          partnership_signals: Array.isArray(startup.partnership_signals)
            ? startup.partnership_signals as string[]
            : startup.partnership_signals ? [startup.partnership_signals as string] : [],
          cultural_markers: Array.isArray(startup.cultural_markers)
            ? startup.cultural_markers
            : startup.cultural_markers ? [startup.cultural_markers as string] : []
        }));
        setTrendingStartups(transformedStartups);
      }

      // Fetch partnership news
      const { data: partnerships, error: partnershipsError } = await supabase
        .from('partnership_news')
        .select('*')
        .order('announcement_date', { ascending: false })
        .limit(10);

      if (partnershipsError) {
        console.error('Error fetching partnership news:', partnershipsError);
      } else {
        // Transform the data to match our interface
        const transformedPartnerships = (partnerships || []).map(partnership => ({
          ...partnership,
          industry_tags: Array.isArray(partnership.industry_tags)
            ? partnership.industry_tags
            : partnership.industry_tags ? [partnership.industry_tags as string] : []
        }));
        setPartnershipNews(transformedPartnerships);
      }
    } catch (error) {
      console.error('Error fetching trending data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshTrendingData = async () => {
    setIsRefreshing(true);
    
    try {
      // Trigger trending startups refresh
      const { error: startupsError } = await supabase.functions.invoke('fetch-trending-startups', {
        body: { industry: brandIndustry || 'technology', limit: 15 }
      });

      if (startupsError) {
        console.error('Error refreshing startups:', startupsError);
      }

      // Trigger partnership news refresh
      const { error: partnershipsError } = await supabase.functions.invoke('fetch-partnership-news', {
        body: { industry: brandIndustry || '', limit: 15 }
      });

      if (partnershipsError) {
        console.error('Error refreshing partnerships:', partnershipsError);
      }

      // Refetch data after refresh
      await fetchTrendingData();

      toast({
        title: "Data Refreshed",
        description: "Trending opportunities have been updated with the latest data.",
      });
    } catch (error) {
      console.error('Error refreshing trending data:', error);
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh trending data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getOpportunityScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRelevanceScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Trending Opportunities
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Trending Opportunities
            </CardTitle>
            <CardDescription>
              Real-time market intelligence and partnership opportunities
            </CardDescription>
          </div>
          <Button 
            onClick={refreshTrendingData}
            disabled={isRefreshing}
            size="sm"
            variant="outline"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="startups" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="startups" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending Startups ({trendingStartups.length})
            </TabsTrigger>
            <TabsTrigger value="partnerships" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Partnership News ({partnershipNews.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="startups" className="space-y-4 mt-6">
            {trendingStartups.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">No Trending Startups Found</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Click refresh to discover the latest trending startups in your industry
                </p>
                <Button onClick={refreshTrendingData} variant="outline">
                  Discover Startups
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {trendingStartups.map((startup) => (
                  <div key={startup.id} className="p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold text-lg">{startup.company_name}</h4>
                          <Badge variant="secondary">{startup.industry}</Badge>
                          {startup.funding_status && startup.funding_status !== 'unknown' && (
                            <Badge variant="outline" className="text-xs">
                              {startup.funding_status}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {startup.description}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`px-2 py-1 rounded text-sm font-bold border ${getOpportunityScoreColor(startup.opportunity_score)}`}>
                          {Math.round(startup.opportunity_score)}% Match
                        </div>
                      </div>
                    </div>

                    {startup.growth_indicators && startup.growth_indicators.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Growth Signals:</h5>
                        <div className="flex flex-wrap gap-1">
                          {startup.growth_indicators.slice(0, 3).map((indicator, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {indicator}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {startup.partnership_signals && startup.partnership_signals.length > 0 && (
                      <div className="mb-3">
                        <h5 className="text-xs font-medium text-muted-foreground mb-1">Partnership Signals:</h5>
                        <div className="flex flex-wrap gap-1">
                          {startup.partnership_signals.slice(0, 3).map((signal, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Found {new Date(startup.discovered_at).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <a href={startup.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Source
                          </a>
                        </Button>
                        <Button size="sm">
                          Connect
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="partnerships" className="space-y-4 mt-6">
            {partnershipNews.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">No Partnership News Found</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Click refresh to discover the latest brand collaboration news
                </p>
                <Button onClick={refreshTrendingData} variant="outline">
                  Discover Partnerships
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {partnershipNews.map((partnership) => (
                  <div key={partnership.id} className="p-4 rounded-lg border bg-card/50 hover:bg-card/70 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">
                            {partnership.brand_1} × {partnership.brand_2}
                          </h4>
                          {partnership.collaboration_type && (
                            <Badge variant="secondary" className="text-xs">
                              {partnership.collaboration_type}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {partnership.summary}
                        </p>
                      </div>
                      <div className="text-right ml-4">
                        <div className={`text-sm font-bold ${getRelevanceScoreColor(partnership.relevance_score)}`}>
                          {Math.round(partnership.relevance_score)}% Relevant
                        </div>
                      </div>
                    </div>

                    {partnership.industry_tags && partnership.industry_tags.length > 0 && (
                      <div className="mb-3">
                        <div className="flex flex-wrap gap-1">
                          {partnership.industry_tags.slice(0, 4).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {new Date(partnership.announcement_date).toLocaleDateString()}
                      </div>
                      <Button size="sm" variant="outline" asChild>
                        <a href={partnership.source_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Read More
                        </a>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}