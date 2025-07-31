import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, MessageCircle, Users, Target, MapPin, Sparkles, Heart, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useBrandDelete } from '@/hooks/useBrandDelete';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface BrandProfile {
  id: string;
  brand_name: string;
  industry: string;
  mission_statement: string;
  audience_age_groups: string[];
  audience_regions: string[];
  cultural_taste_markers: string[];
  collaboration_interests: string[];
  niche_interests: string[];
  created_at: string;
}

interface SynergyAnalysis {
  id: string;
  compared_brand_name: string;
  compared_brand_category: string;
  synergy_summary: string;
  collab_ideas: any;
  pitch_line: string;
  match_score: number;
  qloo_overlap_score: number;
}

const BrandProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [brand, setBrand] = useState<BrandProfile | null>(null);
  const [synergyAnalysis, setSynergyAnalysis] = useState<SynergyAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const { deleteBrandProfile, isDeleting } = useBrandDelete();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (id) {
      fetchBrandProfile();
      fetchSynergyAnalysis();
    }
  }, [user, id, navigate]);

  const fetchBrandProfile = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching brand profile:', error);
      toast({
        title: "Error",
        description: "Could not load brand profile",
        variant: "destructive"
      });
      navigate('/discovery');
      return;
    }

    setBrand(data);
    setLoading(false);
  };

  const fetchSynergyAnalysis = async () => {
    if (!id) return;

    const { data, error } = await supabase
      .from('brand_synergy_analyses')
      .select('*')
      .eq('brand_profile_id', id)
      .eq('gpt_analysis_status', 'completed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching synergy analysis:', error);
    } else {
      setSynergyAnalysis(data || []);
    }
  };

  const handleConnect = async () => {
    if (!brand) return;
    
    setConnecting(true);
    
    // Simulate connection request
    setTimeout(() => {
      setConnecting(false);
      toast({
        title: "Connection Request Sent",
        description: `Your collaboration request has been sent to ${brand.brand_name}`,
      });
    }, 1000);
  };

  const handleDelete = async () => {
    if (!brand || !id) return;
    
    const success = await deleteBrandProfile(id);
    if (success) {
      navigate('/dashboard');
    }
  };

  const getBannerGradient = (brandName: string) => {
    // Generate a consistent gradient based on brand name
    const colors = [
      'from-blue-500 to-purple-600',
      'from-purple-500 to-pink-600',
      'from-pink-500 to-orange-600',
      'from-orange-500 to-red-600',
      'from-red-500 to-purple-600',
      'from-green-500 to-blue-600',
      'from-cyan-500 to-blue-600',
      'from-indigo-500 to-purple-600'
    ];
    
    const hash = brandName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading brand profile...</div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Brand not found</h2>
          <Button onClick={() => navigate('/discovery')}>
            Back to Discovery
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/discovery')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Discovery</span>
          </Button>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              My Dashboard
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Brand Profile</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{brand?.brand_name}"? This action cannot be undone and will permanently remove:
                    <br />• All brand analysis data
                    <br />• Connection requests and conversations
                    <br />• Collaboration insights
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Profile'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <div className={`bg-gradient-to-r ${getBannerGradient(brand.brand_name)} text-white`}>
        <div className="container mx-auto px-6 py-16">
          <div className="max-w-4xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                <span className="text-2xl font-bold">{brand.brand_name.charAt(0)}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold mb-2">{brand.brand_name}</h1>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4" />
                  <span className="text-lg">{brand.industry}</span>
                </div>
              </div>
            </div>
            
            <p className="text-xl opacity-90 mb-6 max-w-2xl">
              {brand.mission_statement}
            </p>

            <div className="flex flex-wrap gap-3">
              <Button 
                size="lg" 
                onClick={handleConnect}
                disabled={connecting}
                className="bg-white text-gray-900 hover:bg-gray-100"
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                {connecting ? 'Connecting...' : 'Connect & Collaborate'}
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Website
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>About {brand.brand_name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Mission Statement</h4>
                  <p className="text-muted-foreground">{brand.mission_statement}</p>
                </div>
                
                <Separator />
                
                <div>
                  <h4 className="font-semibold mb-2">Industry Focus</h4>
                  <Badge variant="secondary" className="text-sm">
                    {brand.industry}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Synergy Analysis */}
            {synergyAnalysis.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span>Collaboration Insights</span>
                  </CardTitle>
                  <CardDescription>
                    AI-powered analysis of collaboration potential
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {synergyAnalysis.slice(0, 2).map((analysis) => (
                    <div key={analysis.id} className="space-y-3 p-4 bg-muted/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">
                          Synergy with {analysis.compared_brand_name}
                        </h4>
                        <Badge 
                          variant={analysis.match_score >= 80 ? 'default' : 'secondary'}
                        >
                          {analysis.match_score}% match
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {analysis.synergy_summary}
                      </p>
                      
                      {analysis.qloo_overlap_score && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Audience Overlap</span>
                            <span>{Math.round(analysis.qloo_overlap_score)}%</span>
                          </div>
                          <Progress value={analysis.qloo_overlap_score} className="h-2" />
                        </div>
                      )}
                      
                      {analysis.pitch_line && (
                        <div className="bg-background p-3 rounded border-l-4 border-primary">
                          <h5 className="font-medium text-sm mb-1">Collaboration Pitch</h5>
                          <p className="text-sm italic">"{analysis.pitch_line}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Audience & Culture */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Users className="w-5 h-5" />
                  <span>Audience & Culture</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Age Groups */}
                {brand.audience_age_groups && brand.audience_age_groups.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Age Groups</h4>
                    <div className="flex flex-wrap gap-1">
                      {brand.audience_age_groups.map((age, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {age}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Regions */}
                {brand.audience_regions && brand.audience_regions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>Regions</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {brand.audience_regions.map((region, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {region}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cultural Markers */}
                {brand.cultural_taste_markers && brand.cultural_taste_markers.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Cultural Tastes</h4>
                    <div className="flex flex-wrap gap-1">
                      {brand.cultural_taste_markers.map((marker, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {marker}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Collaboration Interests */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Collaboration Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {brand.collaboration_interests && brand.collaboration_interests.length > 0 ? (
                  <div className="space-y-2">
                    {brand.collaboration_interests.map((interest, index) => (
                      <div 
                        key={index} 
                        className="flex items-center space-x-2 p-2 rounded bg-muted/50"
                      >
                        <Target className="w-4 h-4 text-primary" />
                        <span className="text-sm">{interest}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    No specific collaboration interests listed
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Niche Interests */}
            {brand.niche_interests && brand.niche_interests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Niche Interests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1">
                    {brand.niche_interests.map((interest, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Brand Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Brand Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Member since</span>
                  <span className="text-sm font-medium">
                    {new Date(brand.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Potential matches</span>
                  <span className="text-sm font-medium">
                    {synergyAnalysis.length} analyzed
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrandProfile;