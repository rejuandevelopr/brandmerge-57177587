import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Building2, Globe } from "lucide-react";

interface LocationData {
  brand_name: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  alignment_score: number;
  same_city?: boolean;
  same_country?: boolean;
  distance_km?: number;
  collaboration_potential: 'high' | 'medium' | 'low';
}

interface GeographicBrandMapProps {
  locationData: LocationData[];
  isLoading?: boolean;
  userBrandLocation?: {
    city?: string;
    country?: string;
  };
}

interface LocationCluster {
  location: string;
  brands: LocationData[];
  averageScore: number;
  totalBrands: number;
}

export const GeographicBrandMap: React.FC<GeographicBrandMapProps> = ({
  locationData,
  isLoading,
  userBrandLocation
}) => {
  const locationClusters = useMemo(() => {
    const clusters: { [key: string]: LocationData[] } = {};
    
    locationData.forEach(brand => {
      const locationKey = brand.country || 'Unknown';
      if (!clusters[locationKey]) {
        clusters[locationKey] = [];
      }
      clusters[locationKey].push(brand);
    });

    return Object.entries(clusters).map(([location, brands]) => ({
      location,
      brands,
      averageScore: brands.reduce((sum, brand) => sum + brand.alignment_score, 0) / brands.length,
      totalBrands: brands.length,
    })).sort((a, b) => b.averageScore - a.averageScore);
  }, [locationData]);

  const getCollaborationColor = (potential: string) => {
    switch (potential) {
      case 'high': return 'bg-green-100 text-green-800 border-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getLocationIcon = (brand: LocationData) => {
    if (brand.same_city) return <Building2 className="h-4 w-4 text-green-600" />;
    if (brand.same_country) return <Users className="h-4 w-4 text-blue-600" />;
    return <Globe className="h-4 w-4 text-gray-600" />;
  };

  const nearbyBrands = locationData.filter(brand => brand.same_city || brand.same_country);
  const internationalBrands = locationData.filter(brand => !brand.same_city && !brand.same_country);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Geographic Distribution</CardTitle>
          <CardDescription>Brand locations and collaboration potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] animate-pulse bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Same City</p>
                <p className="text-2xl font-bold text-green-600">
                  {locationData.filter(b => b.same_city).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Same Country</p>
                <p className="text-2xl font-bold text-blue-600">
                  {locationData.filter(b => b.same_country && !b.same_city).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">International</p>
                <p className="text-2xl font-bold text-purple-600">
                  {internationalBrands.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Countries</p>
                <p className="text-2xl font-bold text-orange-600">
                  {locationClusters.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Location Clusters */}
      <Card>
        <CardHeader>
          <CardTitle>Geographic Clusters</CardTitle>
          <CardDescription>
            Brands grouped by location with average alignment scores
            {userBrandLocation && (
              <span className="block mt-1 text-xs">
                Your location: {userBrandLocation.city}, {userBrandLocation.country}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {locationClusters.map((cluster) => (
              <div key={cluster.location} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <h3 className="font-semibold">{cluster.location}</h3>
                    <Badge variant="secondary">
                      {cluster.totalBrands} brands
                    </Badge>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Avg Score</p>
                    <p className="text-lg font-semibold">{cluster.averageScore.toFixed(1)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cluster.brands.map((brand) => (
                    <div key={brand.brand_name} className="p-3 border rounded-md bg-muted/30">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getLocationIcon(brand)}
                          <span className="font-medium text-sm">{brand.brand_name}</span>
                        </div>
                        <span className="text-sm font-medium">{brand.alignment_score}</span>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          {brand.city && (
                            <span className="text-muted-foreground">{brand.city}</span>
                          )}
                        </div>
                        <Badge 
                          variant="secondary" 
                          className={getCollaborationColor(brand.collaboration_potential)}
                        >
                          {brand.collaboration_potential}
                        </Badge>
                      </div>
                      
                      {brand.distance_km && (
                        <p className="text-xs text-muted-foreground mt-1">
                          ~{Math.round(brand.distance_km)} km away
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Nearby Opportunities */}
      {nearbyBrands.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Local Collaboration Opportunities</CardTitle>
            <CardDescription>Brands in your vicinity with high potential</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {nearbyBrands
                .filter(brand => brand.collaboration_potential === 'high')
                .slice(0, 6)
                .map((brand) => (
                  <div key={brand.brand_name} className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getLocationIcon(brand)}
                        <span className="font-semibold">{brand.brand_name}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        {brand.alignment_score}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {brand.city}, {brand.country}
                    </p>
                    {brand.distance_km && brand.distance_km < 50 && (
                      <p className="text-xs text-green-700 mt-1 font-medium">
                        Local opportunity - {Math.round(brand.distance_km)} km away
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};