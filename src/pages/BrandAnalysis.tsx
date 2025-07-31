import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, TrendingUp, Users, MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import QlooAnalysis from "@/components/QlooAnalysis";
import BrandSynergyAnalysis from "@/components/BrandSynergyAnalysis";

interface BrandProfile {
  id: string;
  brand_name: string;
  industry: string;
  mission_statement: string;
  country: string;
  city_region: string;
  cultural_taste_markers: string[];
  collaboration_interests: string[];
  website_url: string;
}

interface MatchedBrand {
  name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  matchType: string;
  overlapScore: number;
}

interface MatchAnalysis {
  id: string;
  matched_brands: MatchedBrand[];
  analysis_status: string;
  match_count: number;
  search_timestamp: string;
}

interface AnalysisSession {
  id: string;
  session_status: string;
  started_at: string;
  completed_at: string | null;
}

export default function BrandAnalysis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<MatchAnalysis | null>(null);
  const [analysisSession, setAnalysisSession] = useState<AnalysisSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (id) {
      fetchBrandData();
    }
  }, [id, user, navigate]);

  const fetchBrandData = async () => {
    if (!id) return;

    try {
      // Fetch brand profile
      const { data: profile, error: profileError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (profileError) throw profileError;
      setBrandProfile(profile);

      // Fetch existing match analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('brand_match_analyses')
        .select('*')
        .eq('brand_profile_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!analysisError && analysis) {
        setMatchAnalysis({
          ...analysis,
          matched_brands: Array.isArray(analysis.matched_brands) 
            ? (analysis.matched_brands as unknown as MatchedBrand[])
            : []
        });
      }

      // Fetch analysis session
      const { data: session, error: sessionError } = await supabase
        .from('brand_analysis_sessions')
        .select('*')
        .eq('brand_profile_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!sessionError && session) {
        setAnalysisSession(session);
        if (session.session_status === 'analyzing') {
          pollAnalysisProgress();
        }
      }

    } catch (error) {
      console.error('Error fetching brand data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    if (!brandProfile) return;

    setAnalyzing(true);
    setAnalysisProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-brand-matches', {
        body: { brandProfileId: brandProfile.id }
      });

      if (error) throw error;

      setAnalysisProgress(50);
      pollAnalysisProgress();
      
    } catch (error) {
      console.error('Error starting analysis:', error);
      setAnalyzing(false);
    }
  };

  const pollAnalysisProgress = () => {
    const interval = setInterval(async () => {
      if (!id) return;

      const { data: session } = await supabase
        .from('brand_analysis_sessions')
        .select('*')
        .eq('brand_profile_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (session) {
        setAnalysisSession(session);
        
        if (session.session_status === 'completed') {
          setAnalysisProgress(100);
          setAnalyzing(false);
          clearInterval(interval);
          fetchBrandData(); // Refresh data
        } else if (session.session_status === 'analyzing') {
          setAnalysisProgress(prev => Math.min(prev + 10, 90));
        }
      }
    }, 2000);

    return interval;
  };

  const getMatchTypeColor = (matchType: string) => {
    switch (matchType) {
      case 'industry_similar': return 'bg-blue-100 text-blue-800';
      case 'location_based': return 'bg-green-100 text-green-800';
      case 'cultural_alignment': return 'bg-purple-100 text-purple-800';
      case 'partnership_opportunity': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeLabel = (matchType: string) => {
    switch (matchType) {
      case 'industry_similar': return 'Industry Similar';
      case 'location_based': return 'Location Based';
      case 'cultural_alignment': return 'Cultural Alignment';
      case 'partnership_opportunity': return 'Partnership Opportunity';
      default: return 'Other';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Brand not found</h1>
          <Button onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{brandProfile.brand_name} Analysis</h1>
            <p className="text-muted-foreground">
              {brandProfile.industry} • {brandProfile.country || brandProfile.city_region}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          {!matchAnalysis && !analyzing && (
            <Button onClick={startAnalysis} className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>Start Brand Analysis</span>
            </Button>
          )}
        </div>
      </div>

      {/* Analysis Progress */}
      {analyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Analysis in Progress</span>
            </CardTitle>
            <CardDescription>
              Searching for matching brands and analyzing partnerships...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={analysisProgress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2">
              {analysisProgress < 30 && "Initializing analysis..."}
              {analysisProgress >= 30 && analysisProgress < 60 && "Searching for matching brands..."}
              {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing brand compatibility..."}
              {analysisProgress >= 90 && "Finalizing results..."}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Brand Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Brand Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2">Mission Statement</h4>
            <p className="text-muted-foreground">{brandProfile.mission_statement}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Location
              </h4>
              <p className="text-muted-foreground">
                {brandProfile.city_region && `${brandProfile.city_region}, `}
                {brandProfile.country}
              </p>
            </div>
            
            {brandProfile.website_url && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Website
                </h4>
                <a 
                  href={brandProfile.website_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {brandProfile.website_url}
                </a>
              </div>
            )}
          </div>

          {brandProfile.cultural_taste_markers && brandProfile.cultural_taste_markers.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Cultural Taste Markers</h4>
              <div className="flex flex-wrap gap-2">
                {brandProfile.cultural_taste_markers.map((marker, index) => (
                  <Badge key={index} variant="secondary">{marker}</Badge>
                ))}
              </div>
            </div>
          )}

          {brandProfile.collaboration_interests && brandProfile.collaboration_interests.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Collaboration Interests</h4>
              <div className="flex flex-wrap gap-2">
                {brandProfile.collaboration_interests.map((interest, index) => (
                  <Badge key={index} variant="outline">{interest}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google-Sourced Brand Matches */}
      {matchAnalysis && matchAnalysis.matched_brands && matchAnalysis.matched_brands.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Discovered Brand Matches ({matchAnalysis.match_count})</span>
            </CardTitle>
            <CardDescription>
              Real brands found through intelligent search analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Match Type</TableHead>
                  <TableHead>Overlap Score</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matchAnalysis.matched_brands.map((brand, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{brand.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {brand.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{brand.industry}</TableCell>
                    <TableCell>{brand.location}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getMatchTypeColor(brand.matchType)}
                      >
                        {getMatchTypeLabel(brand.matchType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Progress value={brand.overlapScore * 100} className="w-16" />
                        <span className="text-sm font-medium">
                          {(brand.overlapScore * 100).toFixed(0)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {brand.website && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(brand.website, '_blank')}
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Qloo Analysis */}
      <QlooAnalysis
        brandProfileId={brandProfile.id}
        brandName={brandProfile.brand_name}
        onAnalysisUpdate={fetchBrandData}
      />

      {/* Brand Synergy Analysis */}
      <BrandSynergyAnalysis
        brandProfileId={brandProfile.id}
        brandName={brandProfile.brand_name}
        onAnalysisUpdate={fetchBrandData}
      />
    </div>
  );
}