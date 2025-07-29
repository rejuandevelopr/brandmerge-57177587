import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';

const INDUSTRIES = [
  'Technology', 'Fashion', 'Food & Beverage', 'Health & Wellness', 'Entertainment',
  'Sports', 'Travel', 'Finance', 'Education', 'Automotive', 'Beauty', 'Home & Garden'
];

const COLLABORATION_TYPES = [
  { id: 'partnerships', label: 'Partnerships' },
  { id: 'co_launch', label: 'Co-launch' },
  { id: 'cross_promo', label: 'Cross-promotion' },
  { id: 'community', label: 'Community Building' },
  { id: 'sponsorship', label: 'Sponsorship' },
  { id: 'content_collaboration', label: 'Content Collaboration' }
];

const AGE_GROUPS = [
  'Gen Z (18-26)', 'Millennials (27-42)', 'Gen X (43-58)', 'Baby Boomers (59-77)'
];

const BrandBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    brandName: '',
    industry: '',
    missionStatement: '',
    culturalTasteMarkers: [] as string[],
    audienceAgeGroups: [] as string[],
    audienceRegions: [] as string[],
    nicheInterests: [] as string[],
    collaborationInterests: [] as string[]
  });
  
  const [newTag, setNewTag] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(false);

  const addTag = (field: 'culturalTasteMarkers' | 'audienceRegions' | 'nicheInterests', value: string) => {
    if (value.trim() && !formData[field].includes(value.trim())) {
      setFormData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  const removeTag = (field: 'culturalTasteMarkers' | 'audienceRegions' | 'nicheInterests', value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter(item => item !== value)
    }));
  };

  const handleCollaborationChange = (collaborationType: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      collaborationInterests: checked
        ? [...prev.collaborationInterests, collaborationType]
        : prev.collaborationInterests.filter(item => item !== collaborationType)
    }));
  };

  const handleAgeGroupChange = (ageGroup: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      audienceAgeGroups: checked
        ? [...prev.audienceAgeGroups, ageGroup]
        : prev.audienceAgeGroups.filter(item => item !== ageGroup)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    
    const { error } = await supabase
      .from('brand_profiles')
      .insert({
        user_id: user.id,
        brand_name: formData.brandName,
        industry: formData.industry,
        mission_statement: formData.missionStatement,
        cultural_taste_markers: formData.culturalTasteMarkers,
        audience_age_groups: formData.audienceAgeGroups,
        audience_regions: formData.audienceRegions,
        niche_interests: formData.nicheInterests,
        collaboration_interests: formData.collaborationInterests as any
      });

    if (error) {
      toast({
        title: "Error creating brand profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Brand profile created!",
        description: "Your brand profile has been successfully created.",
      });
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">B</span>
            </div>
            <span className="text-xl font-bold text-foreground">BrandMerge</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-2xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create Brand Profile</h1>
          <p className="text-muted-foreground">
            Tell us about your brand to find the perfect collaboration partners
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core details about your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brandName">Brand Name *</Label>
                <Input
                  id="brandName"
                  value={formData.brandName}
                  onChange={(e) => setFormData(prev => ({ ...prev, brandName: e.target.value }))}
                  placeholder="Enter your brand name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <select
                  id="industry"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="">Select an industry</option>
                  {INDUSTRIES.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="missionStatement">Mission Statement</Label>
                <Textarea
                  id="missionStatement"
                  value={formData.missionStatement}
                  onChange={(e) => setFormData(prev => ({ ...prev, missionStatement: e.target.value }))}
                  placeholder="Describe your brand's mission and values"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cultural Taste Markers */}
          <Card>
            <CardHeader>
              <CardTitle>Cultural Taste Markers</CardTitle>
              <CardDescription>Movies, music, influencers, locations, fashion styles that represent your brand</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Add cultural markers (e.g., 'Taylor Swift', 'Minimalist design')"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag('culturalTasteMarkers', newTag);
                      setNewTag('');
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    addTag('culturalTasteMarkers', newTag);
                    setNewTag('');
                  }}
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.culturalTasteMarkers.map(marker => (
                  <Badge key={marker} variant="secondary" className="flex items-center gap-1">
                    {marker}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() => removeTag('culturalTasteMarkers', marker)}
                    />
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Audience Information */}
          <Card>
            <CardHeader>
              <CardTitle>Target Audience</CardTitle>
              <CardDescription>Define your audience demographics and interests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label>Age Groups</Label>
                <div className="grid grid-cols-2 gap-2">
                  {AGE_GROUPS.map(ageGroup => (
                    <div key={ageGroup} className="flex items-center space-x-2">
                      <Checkbox
                        id={ageGroup}
                        checked={formData.audienceAgeGroups.includes(ageGroup)}
                        onCheckedChange={(checked) => handleAgeGroupChange(ageGroup, checked as boolean)}
                      />
                      <Label htmlFor={ageGroup} className="text-sm">{ageGroup}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Regions</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newRegion}
                    onChange={(e) => setNewRegion(e.target.value)}
                    placeholder="Add regions (e.g., 'North America', 'Urban areas')"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('audienceRegions', newRegion);
                        setNewRegion('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addTag('audienceRegions', newRegion);
                      setNewRegion('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.audienceRegions.map(region => (
                    <Badge key={region} variant="secondary" className="flex items-center gap-1">
                      {region}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag('audienceRegions', region)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Niche Interests</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    placeholder="Add interests (e.g., 'Sustainability', 'Gaming')"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTag('nicheInterests', newInterest);
                        setNewInterest('');
                      }
                    }}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      addTag('nicheInterests', newInterest);
                      setNewInterest('');
                    }}
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.nicheInterests.map(interest => (
                    <Badge key={interest} variant="secondary" className="flex items-center gap-1">
                      {interest}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() => removeTag('nicheInterests', interest)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Collaboration Interests */}
          <Card>
            <CardHeader>
              <CardTitle>Collaboration Interests</CardTitle>
              <CardDescription>What types of collaborations are you interested in?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {COLLABORATION_TYPES.map(type => (
                  <div key={type.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={type.id}
                      checked={formData.collaborationInterests.includes(type.id)}
                      onCheckedChange={(checked) => handleCollaborationChange(type.id, checked as boolean)}
                    />
                    <Label htmlFor={type.id}>{type.label}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={() => navigate('/dashboard')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.brandName}>
              {loading ? "Creating..." : "Create Brand Profile"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default BrandBuilder;