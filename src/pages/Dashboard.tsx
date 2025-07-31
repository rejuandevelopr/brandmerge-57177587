import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { BrandTable } from '@/components/BrandTable';
import Navbar from '@/components/Navbar';

interface BrandProfile {
  id: string;
  brand_name: string;
  industry: string;
  mission_statement: string;
  created_at: string;
  country?: string;
  city_region?: string;
  physical_address?: string;
  website_url?: string;
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
      .select('id, brand_name, industry, mission_statement, created_at, country, city_region, physical_address, website_url')
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
      <Navbar />
      
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-6 pt-24">
        <BrandTable 
          brandProfiles={brandProfiles} 
          loading={loading}
          onRefresh={fetchBrandProfiles}
          onBrandDeleted={fetchBrandProfiles}
        />
      </main>
    </div>
  );
};

export default Dashboard;