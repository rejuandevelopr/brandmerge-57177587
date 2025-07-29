import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, RefreshCw, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import BrandSynergyAnalysis from './BrandSynergyAnalysis';

interface SimilarBrand {
  name: string;
  overlapScore: number;
  category?: string;
}

interface QlooAnalysisData {
  id: string;
  brand_profile_id: string;
  similar_brands: SimilarBrand[] | null;
  overlap_scores: { overall?: number } | null;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  error_message?: string | null;
  analysis_timestamp: string;
  last_updated: string;
}

interface QlooAnalysisProps {
  brandProfileId: string;
  brandName: string;
  onAnalysisUpdate?: () => void;
}

export default function QlooAnalysis({ brandProfileId, brandName, onAnalysisUpdate }: QlooAnalysisProps) {
  const [analysisData, setAnalysisData] = useState<QlooAnalysisData | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisData();
  }, [brandProfileId]);

  const fetchAnalysisData = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_qloo_analyses')
        .select('*')
        .eq('brand_profile_id', brandProfileId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching analysis data:', error);
        return;
      }

      if (data) {
        // Type-safe conversion of JSON data
        const analysisData: QlooAnalysisData = {
          ...data,
          similar_brands: Array.isArray(data.similar_brands) ? data.similar_brands as unknown as SimilarBrand[] : null,
          overlap_scores: data.overlap_scores && typeof data.overlap_scores === 'object' 
            ? data.overlap_scores as { overall?: number } 
            : null,
          status: data.status as 'pending' | 'analyzing' | 'completed' | 'error'
        };
        setAnalysisData(analysisData);
      } else {
        setAnalysisData(null);
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const triggerAnalysis = async () => {
    setIsAnalyzing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand-with-qloo', {
        body: { brandProfileId }
      });

      if (error) {
        console.error('Error triggering analysis:', error);
        setIsAnalyzing(false);
        toast({
          title: "Analysis Failed",
          description: `Failed to start brand analysis: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Analysis Started",
        description: "Your brand analysis is in progress. Results will appear shortly.",
      });

      // Poll for updates with better state tracking
      let pollCount = 0;
      const maxPolls = 40; // 2 minutes max (40 * 3 seconds)
      
      const pollInterval = setInterval(async () => {
        pollCount++;
        await fetchAnalysisData();
        
        // Check current data state
        const currentData = await getCurrentAnalysisData();
        
        if (currentData?.status === 'completed' || currentData?.status === 'error') {
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          onAnalysisUpdate?.();
          
          // Auto-trigger synergy analysis after successful Qloo analysis
          if (currentData?.status === 'completed') {
            setTimeout(async () => {
              try {
                await supabase.functions.invoke('analyze-brand-synergy', {
                  body: { brandProfileId }
                });
              } catch (error) {
                console.error('Failed to auto-trigger synergy analysis:', error);
              }
            }, 1000);
          }
        } else if (pollCount >= maxPolls) {
          // Timeout after 2 minutes
          clearInterval(pollInterval);
          setIsAnalyzing(false);
          toast({
            title: "Analysis Timeout",
            description: "Analysis is taking longer than expected. Please try again.",
            variant: "destructive",
          });
        }
      }, 3000);

    } catch (error) {
      console.error('Error triggering analysis:', error);
      setIsAnalyzing(false);
      
      const errorMessage = error.message || "An unexpected error occurred. Please try again.";
      toast({
        title: "Analysis Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Helper function to get fresh analysis data
  const getCurrentAnalysisData = async () => {
    try {
      const { data } = await supabase
        .from('brand_qloo_analyses')
        .select('*')
        .eq('brand_profile_id', brandProfileId)
        .maybeSingle();
      return data;
    } catch (error) {
      console.error('Error fetching current analysis data:', error);
      return null;
    }
  };

  const getStatusIcon = () => {
    if (isAnalyzing || analysisData?.status === 'analyzing' || analysisData?.status === 'pending') {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (analysisData?.status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    if (analysisData?.status === 'error') {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getStatusText = () => {
    if (isAnalyzing || analysisData?.status === 'analyzing') return 'Analyzing...';
    if (analysisData?.status === 'pending') return 'Analysis pending...';
    if (analysisData?.status === 'completed') return 'Analysis complete';
    if (analysisData?.status === 'error') return 'Analysis failed';
    return 'Not analyzed';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Qloo Brand Analysis
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
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Qloo Brand Analysis
        </CardTitle>
        <CardDescription>
          Discover brands that align with your cultural taste and audience preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium">{getStatusText()}</span>
          </div>
          <Button 
            onClick={triggerAnalysis}
            disabled={isAnalyzing || analysisData?.status === 'analyzing'}
            size="sm"
            variant="outline"
          >
            {isAnalyzing || analysisData?.status === 'analyzing' ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              analysisData?.status === 'completed' ? 'Re-analyze' : 'Analyze Brand'
            )}
          </Button>
        </div>

        {analysisData?.status === 'error' && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">
              {analysisData.error_message || 'Analysis failed. Please try again.'}
            </p>
          </div>
        )}

        {analysisData?.status === 'completed' && analysisData.similar_brands && (
          <div className="space-y-4">
            <div>
              <h4 className="text-lg font-semibold mb-2">Your brand aligns with:</h4>
              {analysisData.overlap_scores?.overall && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Overall Alignment Score</span>
                    <span className="text-sm font-bold">{analysisData.overlap_scores.overall}%</span>
                  </div>
                  <Progress value={analysisData.overlap_scores.overall} className="h-2" />
                </div>
              )}
            </div>

            <div className="grid gap-3">
              {analysisData.similar_brands.map((brand, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-semibold">{brand.name}</h5>
                      {brand.category && (
                        <Badge variant="secondary" className="text-xs">
                          {brand.category}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{brand.overlapScore}%</div>
                    <div className="text-xs text-muted-foreground">alignment</div>
                  </div>
                </div>
              ))}
            </div>

            {analysisData.analysis_timestamp && (
              <p className="text-xs text-muted-foreground">
                Last analyzed: {new Date(analysisData.analysis_timestamp).toLocaleDateString()}
              </p>
            )}
          </div>
        )}

        {analysisData?.status === 'completed' && (
          <BrandSynergyAnalysis 
            brandProfileId={brandProfileId}
            brandName={brandName}
            onAnalysisUpdate={onAnalysisUpdate}
          />
        )}

        {!analysisData && (
          <div className="text-center py-8">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold mb-2">Discover Your Brand Alignment</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Analyze {brandName} to find similar brands and cultural taste overlap scores
            </p>
            <Button onClick={triggerAnalysis}>
              Start Analysis
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
