import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Brain, Copy, Check, Lightbulb, Target } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SynergyData {
  id: string;
  compared_brand_name: string;
  compared_brand_category: string | null;
  synergy_summary: string | null;
  collab_ideas: any;
  pitch_line: string | null;
  match_score: number | null;
  qloo_overlap_score: number | null;
  gpt_analysis_status: string;
  error_message: string | null;
}

interface BrandSynergyAnalysisProps {
  brandProfileId: string;
  brandName: string;
  onAnalysisUpdate?: () => void;
}

const BrandSynergyAnalysis: React.FC<BrandSynergyAnalysisProps> = ({
  brandProfileId,
  brandName,
  onAnalysisUpdate
}) => {
  const [synergyData, setSynergyData] = useState<SynergyData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState<string>('not_analyzed');
  const [copiedPitch, setCopiedPitch] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchSynergyData();
    fetchAnalysisStatus();
  }, [brandProfileId]);

  const fetchSynergyData = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_synergy_analyses')
        .select('*')
        .eq('brand_profile_id', brandProfileId)
        .order('match_score', { ascending: false });

      if (error) throw error;
      setSynergyData(data || []);
    } catch (error) {
      console.error('Error fetching synergy data:', error);
    }
  };

  const fetchAnalysisStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('brand_profiles')
        .select('gpt_synergy_status')
        .eq('id', brandProfileId)
        .single();

      if (error) throw error;
      setAnalysisStatus(data?.gpt_synergy_status || 'not_analyzed');
    } catch (error) {
      console.error('Error fetching analysis status:', error);
    }
  };

  const triggerSynergyAnalysis = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand-synergy', {
        body: { brandProfileId }
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Synergy Analysis Started",
          description: "GPT is analyzing brand synergies. This may take a moment.",
        });
        
        // Poll for updates
        pollForUpdates();
        onAnalysisUpdate?.();
      } else {
        throw new Error(data?.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('Error triggering synergy analysis:', error);
      toast({
        title: "Analysis Failed", 
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const pollForUpdates = () => {
    const interval = setInterval(async () => {
      await fetchAnalysisStatus();
      await fetchSynergyData();
      
      const { data } = await supabase
        .from('brand_profiles')
        .select('gpt_synergy_status')
        .eq('id', brandProfileId)
        .single();
        
      if (data?.gpt_synergy_status === 'completed' || data?.gpt_synergy_status === 'failed') {
        clearInterval(interval);
        setIsLoading(false);
      }
    }, 3000);

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  const copyPitchLine = async (pitchLine: string, brandName: string) => {
    try {
      await navigator.clipboard.writeText(pitchLine);
      setCopiedPitch(brandName);
      setTimeout(() => setCopiedPitch(null), 2000);
      toast({
        title: "Copied!",
        description: "Pitch line copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const getMatchScoreColor = (score: number | null) => {
    if (!score) return 'bg-muted';
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    if (score >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusDisplay = () => {
    switch (analysisStatus) {
      case 'analyzing':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Analyzing synergies...</span>
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2 text-green-600">
            <Brain className="h-4 w-4" />
            <span>Analysis complete</span>
          </div>
        );
      case 'failed':
        return (
          <div className="flex items-center gap-2 text-red-600">
            <Brain className="h-4 w-4" />
            <span>Analysis failed</span>
          </div>
        );
      default:
        return null;
    }
  };

  if (synergyData.length === 0 && analysisStatus === 'not_analyzed') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Brand Synergy Analysis
          </CardTitle>
          <CardDescription>
            Get AI-powered insights about collaboration opportunities with similar brands
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={triggerSynergyAnalysis} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Start Synergy Analysis
              </>
            )}
          </Button>
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
              <Brain className="h-5 w-5" />
              Brand Synergy Analysis
            </CardTitle>
            <CardDescription>
              AI-powered collaboration insights for {brandName}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {getStatusDisplay()}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={triggerSynergyAnalysis}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Re-analyze'
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {synergyData.map((synergy) => (
            <Card key={synergy.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">{synergy.compared_brand_name}</h4>
                    {synergy.compared_brand_category && (
                      <p className="text-sm text-muted-foreground">{synergy.compared_brand_category}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {synergy.qloo_overlap_score && (
                      <Badge variant="outline">
                        {synergy.qloo_overlap_score}% overlap
                      </Badge>
                    )}
                    {synergy.match_score && (
                      <Badge className={`text-white ${getMatchScoreColor(synergy.match_score)}`}>
                        {synergy.match_score}/100
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {synergy.gpt_analysis_status === 'completed' ? (
                  <>
                    {synergy.synergy_summary && (
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Why This Partnership Works
                        </h5>
                        <p className="text-sm text-muted-foreground">{synergy.synergy_summary}</p>
                      </div>
                    )}

                    {synergy.collab_ideas && synergy.collab_ideas.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4" />
                          Collaboration Ideas
                        </h5>
                        <ul className="space-y-1">
                          {synergy.collab_ideas.map((idea, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary mt-1">•</span>
                              {idea}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {synergy.pitch_line && (
                      <div>
                        <Separator className="my-3" />
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-medium">Pitch Line</h5>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyPitchLine(synergy.pitch_line!, synergy.compared_brand_name)}
                            className="h-auto p-1"
                          >
                            {copiedPitch === synergy.compared_brand_name ? (
                              <Check className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded mt-2 italic">
                          "{synergy.pitch_line}"
                        </p>
                      </div>
                    )}
                  </>
                ) : synergy.gpt_analysis_status === 'failed' ? (
                  <div className="text-sm text-red-600">
                    Analysis failed: {synergy.error_message || 'Unknown error'}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analyzing synergy...</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BrandSynergyAnalysis;