import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BrandLogo } from '@/components/ui/brand-logo';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

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

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Switzerland', 'Austria',
  'Australia', 'New Zealand', 'Japan', 'South Korea', 'Singapore', 'Hong Kong',
  'Brazil', 'Mexico', 'Argentina', 'India', 'China', 'United Arab Emirates',
  'Israel', 'South Africa', 'Nigeria', 'Kenya', 'Other'
];

const STEPS = [
  { id: 1, title: 'Basic Information', description: 'Core details about your brand' },
  { id: 2, title: 'Cultural Taste Markers', description: 'Movies, music, influencers that represent your brand' },
  { id: 3, title: 'Target Audience', description: 'Define your audience demographics and interests' },
  { id: 4, title: 'Location Details', description: 'Help us find local collaboration opportunities' },
  { id: 5, title: 'Collaboration Interests', description: 'What types of collaborations are you interested in?' }
];

const BrandBuilder = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [currentStep, setCurrentStep] = useState(() => {
    const stepParam = searchParams.get('step');
    return stepParam ? Math.min(Math.max(parseInt(stepParam, 10), 1), 5) : 1;
  });
  
  const [formData, setFormData] = useState({
    brandName: '',
    industry: '',
    missionStatement: '',
    culturalTasteMarkers: [] as string[],
    audienceAgeGroups: [] as string[],
    audienceRegions: [] as string[],
    nicheInterests: [] as string[],
    collaborationInterests: [] as string[],
    country: '',
    cityRegion: '',
    physicalAddress: '',
    websiteUrl: ''
  });
  
  const [newTag, setNewTag] = useState('');
  const [newRegion, setNewRegion] = useState('');
  const [newInterest, setNewInterest] = useState('');
  const [loading, setLoading] = useState(false);

  // Update URL when step changes
  useEffect(() => {
    setSearchParams({ step: currentStep.toString() });
  }, [currentStep, setSearchParams]);

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

  // Step validation
  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.brandName.trim() !== '';
      case 2:
        return true; // Optional step
      case 3:
        return true; // Optional step
      case 4:
        return formData.country !== '' && formData.cityRegion.trim() !== '';
      case 5:
        return true; // Optional step
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 5 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (step: number) => {
    if (step <= currentStep || isStepValid(step - 1)) {
      setCurrentStep(step);
    }
  };

  const handleSubmit = async () => {
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
        collaboration_interests: formData.collaborationInterests as any,
        country: formData.country,
        city_region: formData.cityRegion,
        physical_address: formData.physicalAddress || null,
        website_url: formData.websiteUrl || null
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
              <BrandLogo className="text-primary-foreground" size={20} />
            </div>
            <span className="text-xl font-bold text-foreground">BrandMerge</span>
          </div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-2xl">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Create Brand Profile</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tell us about your brand to find the perfect collaboration partners
          </p>
        </div>

        {/* Progress Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-muted-foreground">
              Step {currentStep} of {STEPS.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round((currentStep / STEPS.length) * 100)}% Complete
            </span>
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} className="mb-6" />
          
          {/* Step Indicator */}
          <div className="flex justify-between items-center mb-6 sm:mb-8 overflow-x-auto">
            {STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex flex-col items-center cursor-pointer transition-all flex-shrink-0 ${
                  step.id <= currentStep ? 'text-primary' : 'text-muted-foreground'
                }`}
                onClick={() => goToStep(step.id)}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-all ${
                    step.id < currentStep
                      ? 'bg-primary text-primary-foreground border-primary'
                      : step.id === currentStep
                      ? 'border-primary text-primary bg-background'
                      : 'border-muted-foreground/30 bg-background'
                  }`}
                >
                  {step.id < currentStep ? <Check className="w-3 h-3 sm:w-4 sm:h-4" /> : step.id}
                </div>
                <span className="text-xs mt-1 sm:mt-2 text-center max-w-16 sm:max-w-20 leading-tight hidden sm:block">
                  {step.title}
                </span>
                <span className="text-xs mt-1 text-center sm:hidden">
                  {step.id}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4 sm:space-y-6">
          {/* Step Content */}
          {currentStep === 1 && (
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
          )}

          {currentStep === 2 && (
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
          )}

          {currentStep === 3 && (
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
          )}

          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>Help us find local collaboration opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
                  <Select value={formData.country} onValueChange={(value) => setFormData(prev => ({ ...prev, country: value }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cityRegion">City/Region *</Label>
                  <Input
                    id="cityRegion"
                    type="text"
                    value={formData.cityRegion}
                    onChange={(e) => setFormData(prev => ({ ...prev, cityRegion: e.target.value }))}
                    placeholder="e.g., San Francisco, London, Tokyo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="physicalAddress">Physical Address (Optional)</Label>
                  <Textarea
                    id="physicalAddress"
                    value={formData.physicalAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, physicalAddress: e.target.value }))}
                    placeholder="Full address for deeper local search (optional)"
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website/Online Presence (Optional)</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://your-website.com"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {currentStep === 5 && (
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
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>

            {currentStep < 5 ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!isStepValid(currentStep)}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !isStepValid(4)}
                className="flex items-center gap-2"
              >
                {loading ? 'Creating...' : 'Create Profile'}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default BrandBuilder;