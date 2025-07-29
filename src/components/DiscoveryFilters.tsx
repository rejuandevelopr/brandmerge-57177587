import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, FilterX } from 'lucide-react';

interface Filters {
  industry: string;
  location: string;
  minMatchScore: number;
  culturalTastes: string[];
  collaborationGoals: string[];
}

interface DiscoveryFiltersProps {
  filters: Filters;
  onFiltersChange: (filters: Filters) => void;
  brands: Array<{
    industry: string;
    audience_regions?: string[];
    cultural_taste_markers?: string[];
    collaboration_interests?: string[];
  }>;
}

const DiscoveryFilters = ({ filters, onFiltersChange, brands }: DiscoveryFiltersProps) => {
  // Extract unique values from brands for filter options
  const industries = Array.from(new Set(brands.map(b => b.industry))).sort();
  const regions = Array.from(new Set(brands.flatMap(b => b.audience_regions || []))).sort();
  const culturalTastes = Array.from(new Set(brands.flatMap(b => b.cultural_taste_markers || []))).sort();
  const collaborationInterests = Array.from(new Set(brands.flatMap(b => b.collaboration_interests || []))).sort();

  const updateFilters = (updates: Partial<Filters>) => {
    onFiltersChange({ ...filters, ...updates });
  };

  const addCulturalTaste = (taste: string) => {
    if (!filters.culturalTastes.includes(taste)) {
      updateFilters({
        culturalTastes: [...filters.culturalTastes, taste]
      });
    }
  };

  const removeCulturalTaste = (taste: string) => {
    updateFilters({
      culturalTastes: filters.culturalTastes.filter(t => t !== taste)
    });
  };

  const addCollaborationGoal = (goal: string) => {
    if (!filters.collaborationGoals.includes(goal)) {
      updateFilters({
        collaborationGoals: [...filters.collaborationGoals, goal]
      });
    }
  };

  const removeCollaborationGoal = (goal: string) => {
    updateFilters({
      collaborationGoals: filters.collaborationGoals.filter(g => g !== goal)
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      industry: '',
      location: '',
      minMatchScore: 0,
      culturalTastes: [],
      collaborationGoals: []
    });
  };

  const hasActiveFilters = filters.industry || filters.location || filters.minMatchScore > 0 || 
    filters.culturalTastes.length > 0 || filters.collaborationGoals.length > 0;

  return (
    <div className="border-b border-border bg-muted/20">
      <div className="container mx-auto px-6 py-6">
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filter Brands</CardTitle>
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="flex items-center space-x-1"
                >
                  <FilterX className="w-4 h-4" />
                  <span>Clear All</span>
                </Button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Industry Filter */}
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select 
                  value={filters.industry} 
                  onValueChange={(value) => updateFilters({ industry: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any industry</SelectItem>
                    {industries.map(industry => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => updateFilters({ location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any location</SelectItem>
                    {regions.map(region => (
                      <SelectItem key={region} value={region}>
                        {region}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Match Score Filter */}
              <div className="space-y-2">
                <Label>Minimum Match Score</Label>
                <div className="space-y-2">
                  <Slider
                    value={[filters.minMatchScore]}
                    onValueChange={([value]) => updateFilters({ minMatchScore: value })}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-muted-foreground text-center">
                    {filters.minMatchScore}%+
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-2">
                <Label>Active Filters</Label>
                <div className="text-sm text-muted-foreground">
                  {hasActiveFilters ? (
                    <div className="space-y-1">
                      {filters.industry && <div>Industry: {filters.industry}</div>}
                      {filters.location && <div>Location: {filters.location}</div>}
                      {filters.minMatchScore > 0 && <div>Match: {filters.minMatchScore}%+</div>}
                      {filters.culturalTastes.length > 0 && <div>Cultural: {filters.culturalTastes.length} selected</div>}
                      {filters.collaborationGoals.length > 0 && <div>Goals: {filters.collaborationGoals.length} selected</div>}
                    </div>
                  ) : (
                    'No filters applied'
                  )}
                </div>
              </div>
            </div>

            {/* Cultural Tastes */}
            <div className="space-y-3">
              <Label>Cultural Taste Markers</Label>
              <div className="space-y-2">
                <Select onValueChange={addCulturalTaste}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Add cultural taste..." />
                  </SelectTrigger>
                  <SelectContent>
                    {culturalTastes
                      .filter(taste => !filters.culturalTastes.includes(taste))
                      .map(taste => (
                        <SelectItem key={taste} value={taste}>
                          {taste}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {filters.culturalTastes.map(taste => (
                    <Badge 
                      key={taste} 
                      variant="secondary" 
                      className="flex items-center space-x-1"
                    >
                      <span>{taste}</span>
                      <button
                        onClick={() => removeCulturalTaste(taste)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Collaboration Goals */}
            <div className="space-y-3">
              <Label>Collaboration Interests</Label>
              <div className="space-y-2">
                <Select onValueChange={addCollaborationGoal}>
                  <SelectTrigger className="w-full md:w-64">
                    <SelectValue placeholder="Add collaboration goal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {collaborationInterests
                      .filter(goal => !filters.collaborationGoals.includes(goal))
                      .map(goal => (
                        <SelectItem key={goal} value={goal}>
                          {goal}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {filters.collaborationGoals.map(goal => (
                    <Badge 
                      key={goal} 
                      variant="secondary" 
                      className="flex items-center space-x-1"
                    >
                      <span>{goal}</span>
                      <button
                        onClick={() => removeCollaborationGoal(goal)}
                        className="ml-1 hover:bg-muted rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DiscoveryFilters;