import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, Filter, Users, Zap, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BrandMatchCard from '@/components/BrandMatchCard';
import DiscoveryFilters from '@/components/DiscoveryFilters';

interface DiscoveryBrand {
  id: string;
  brand_name: string;
  industry: string;
  mission_statement: string;
  audience_regions: string[];
  cultural_taste_markers: string[];
  collaboration_interests: string[];
  match_score?: number;
  overlap_percentage?: number;
}

const Discovery = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<DiscoveryBrand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<DiscoveryBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentBrandId, setCurrentBrandId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    industry: '',
    location: '',
    minMatchScore: 0,
    culturalTastes: [] as string[],
    collaborationGoals: [] as string[]
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchDiscoveryBrands();
  }, [user, navigate]);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, filters, brands]);

  const fetchDiscoveryBrands = async () => {
    if (!user) return;

    // First get current user's first brand for connection requests
    const { data: userBrands } = await supabase
      .from('brand_profiles')
      .select('id')
      .eq('user_id', user.id)
      .limit(1);

    if (userBrands && userBrands.length > 0) {
      setCurrentBrandId(userBrands[0].id);
    }

    // Fetch brands from other users (excluding current user's brands)
    const { data: otherBrands, error } = await supabase
      .from('brand_profiles')
      .select('*')
      .neq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching discovery brands:', error);
      setLoading(false);
      return;
    }

    // Simulate match scores and overlap percentages for demo
    const brandsWithScores = (otherBrands || []).map(brand => ({
      ...brand,
      match_score: Math.floor(Math.random() * 40) + 60, // 60-100 range
      overlap_percentage: Math.floor(Math.random() * 30) + 20 // 20-50 range
    }));

    setBrands(brandsWithScores);
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = brands;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(brand =>
        brand.brand_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.mission_statement?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Industry filter
    if (filters.industry) {
      filtered = filtered.filter(brand =>
        brand.industry.toLowerCase().includes(filters.industry.toLowerCase())
      );
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(brand =>
        brand.audience_regions?.some(region =>
          region.toLowerCase().includes(filters.location.toLowerCase())
        )
      );
    }

    // Match score filter
    if (filters.minMatchScore > 0) {
      filtered = filtered.filter(brand =>
        (brand.match_score || 0) >= filters.minMatchScore
      );
    }

    // Cultural tastes filter
    if (filters.culturalTastes.length > 0) {
      filtered = filtered.filter(brand =>
        brand.cultural_taste_markers?.some(marker =>
          filters.culturalTastes.includes(marker)
        )
      );
    }

    // Collaboration goals filter
    if (filters.collaborationGoals.length > 0) {
      filtered = filtered.filter(brand =>
        brand.collaboration_interests?.some(interest =>
          filters.collaborationGoals.includes(interest)
        )
      );
    }

    // Sort by match score
    filtered.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));

    setFilteredBrands(filtered);
  };

  const handleViewProfile = (brandId: string) => {
    navigate(`/brand-profile/${brandId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading discovery...</div>
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
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              My Dashboard
            </Button>
            <span className="text-muted-foreground">Discover Brands</span>
          </div>
        </div>
      </header>

      {/* Search and Filter Bar */}
      <div className="border-b border-border bg-background/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search brands, industries, missions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </Button>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{filteredBrands.length} brands found</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <DiscoveryFilters
          filters={filters}
          onFiltersChange={setFilters}
          brands={brands}
        />
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Discover Brands</h1>
          <p className="text-muted-foreground">
            Find your perfect brand collaboration partners
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Star className="w-5 h-5 text-primary" />
                <span>Top Matches</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {filteredBrands.filter(b => (b.match_score || 0) >= 85).length}
              </div>
              <p className="text-sm text-muted-foreground">85%+ compatibility</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Zap className="w-5 h-5 text-primary" />
                <span>High Synergy</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                {filteredBrands.filter(b => (b.overlap_percentage || 0) >= 40).length}
              </div>
              <p className="text-sm text-muted-foreground">40%+ audience overlap</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Users className="w-5 h-5 text-primary" />
                <span>Total Brands</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{filteredBrands.length}</div>
              <p className="text-sm text-muted-foreground">Available for collaboration</p>
            </CardContent>
          </Card>
        </div>

        {/* Brand Grid */}
        {filteredBrands.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No brands found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or filters
              </p>
              <Button onClick={() => {
                setSearchQuery('');
                setFilters({
                  industry: '',
                  location: '',
                  minMatchScore: 0,
                  culturalTastes: [],
                  collaborationGoals: []
                });
              }}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBrands.map((brand) => (
              <BrandMatchCard
                key={brand.id}
                brand={brand}
                currentBrandId={currentBrandId || undefined}
                onViewProfile={() => handleViewProfile(brand.id)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Discovery;