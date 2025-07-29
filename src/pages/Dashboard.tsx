import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus } from 'lucide-react';

interface BrandProfile {
  id: string;
  brand_name: string;
  industry: string;
  mission_statement: string;
  created_at: string;
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    fetchBrandProfiles();
  }, [user, navigate]);

  const fetchBrandProfiles = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('brand_profiles')
      .select('id, brand_name, industry, mission_statement, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching brand profiles:', error);
    } else {
      setBrandProfiles(data || []);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div 
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">B</span>
            </div>
            <span className="text-xl font-bold text-foreground">BrandMerge</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-muted-foreground">Welcome, {user?.email}</span>
            <Button variant="ghost" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Brand Profiles</h1>
            <p className="text-muted-foreground">
              Manage your brand profiles and discover collaboration opportunities
            </p>
          </div>
          <Button onClick={() => navigate('/brand-builder')}>
            <Plus className="w-4 h-4 mr-2" />
            Create Brand Profile
          </Button>
        </div>

        {/* Brand Profiles Grid */}
        {brandProfiles.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No brand profiles yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first brand profile to start connecting with other brands
              </p>
              <Button onClick={() => navigate('/brand-builder')}>
                Create Your First Brand Profile
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {brandProfiles.map((profile) => (
              <Card key={profile.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-xl">{profile.brand_name}</CardTitle>
                  <CardDescription>{profile.industry}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {profile.mission_statement}
                  </p>
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground">
                      Created {new Date(profile.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;