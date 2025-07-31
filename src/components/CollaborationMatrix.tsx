import React, { useMemo } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, TrendingUp, Users, Building2 } from "lucide-react";

interface CollaborationDataPoint {
  brand_name: string;
  alignment_score: number;
  collaboration_potential_score: number;
  industry?: string;
  location_relevance: number;
  trend_direction: 'rising' | 'falling' | 'stable' | 'new';
  qloo_score?: number;
  same_city?: boolean;
  same_country?: boolean;
}

interface CollaborationMatrixProps {
  data: CollaborationDataPoint[];
  isLoading?: boolean;
  onBrandSelect?: (brandName: string) => void;
}

const chartConfig = {
  alignment_score: {
    label: "Cultural Alignment",
    color: "hsl(var(--primary))",
  },
  collaboration_potential_score: {
    label: "Collaboration Potential", 
    color: "hsl(var(--secondary))",
  },
};

const getTrendColor = (direction: string) => {
  switch (direction) {
    case 'rising': return 'hsl(var(--success))';
    case 'falling': return 'hsl(var(--destructive))';
    case 'new': return 'hsl(var(--primary))';
    default: return 'hsl(var(--muted))';
  }
};

const getCollaborationPotentialScore = (brand: CollaborationDataPoint): number => {
  let score = brand.alignment_score;
  
  // Boost for location relevance
  score += brand.location_relevance * 20;
  
  // Boost for same city/country
  if (brand.same_city) score += 15;
  else if (brand.same_country) score += 8;
  
  // Trend bonus
  if (brand.trend_direction === 'rising') score += 10;
  else if (brand.trend_direction === 'new') score += 5;
  
  // Qloo score factor
  if (brand.qloo_score) {
    score = (score + brand.qloo_score) / 2;
  }
  
  return Math.min(100, Math.max(0, score));
};

export const CollaborationMatrix: React.FC<CollaborationMatrixProps> = ({
  data,
  isLoading,
  onBrandSelect
}) => {
  const enrichedData = useMemo(() => {
    return data.map(brand => ({
      ...brand,
      collaboration_potential_score: getCollaborationPotentialScore(brand),
      x: brand.alignment_score,
      y: getCollaborationPotentialScore(brand),
      fill: getTrendColor(brand.trend_direction),
      size: brand.same_city ? 100 : brand.same_country ? 80 : 60,
    }));
  }, [data]);

  const quadrants = useMemo(() => {
    const highAlignment = enrichedData.filter(d => d.x >= 70);
    const highPotential = enrichedData.filter(d => d.y >= 70);
    const sweetSpot = enrichedData.filter(d => d.x >= 70 && d.y >= 70);
    const emerging = enrichedData.filter(d => d.trend_direction === 'rising' || d.trend_direction === 'new');

    return {
      sweetSpot: sweetSpot.length,
      highAlignment: highAlignment.length,
      highPotential: highPotential.length,
      emerging: emerging.length,
    };
  }, [enrichedData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collaboration Opportunity Matrix</CardTitle>
          <CardDescription>Cultural alignment vs collaboration potential</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[500px] animate-pulse bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-semibold">{data.brand_name}</p>
          <div className="space-y-1 text-sm">
            <p>Alignment: {data.alignment_score}%</p>
            <p>Potential: {data.collaboration_potential_score.toFixed(1)}%</p>
            <p>Trend: {data.trend_direction}</p>
            {data.industry && <p>Industry: {data.industry}</p>}
            {data.same_city && (
              <div className="flex items-center gap-1 text-green-600">
                <Building2 className="h-3 w-3" />
                <span>Same city</span>
              </div>
            )}
            {data.same_country && !data.same_city && (
              <div className="flex items-center gap-1 text-blue-600">
                <Users className="h-3 w-3" />
                <span>Same country</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm text-muted-foreground">Sweet Spot</p>
                <p className="text-xl font-bold text-green-600">{quadrants.sweetSpot}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm text-muted-foreground">High Alignment</p>
                <p className="text-xl font-bold text-blue-600">{quadrants.highAlignment}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500"></div>
              <div>
                <p className="text-sm text-muted-foreground">High Potential</p>
                <p className="text-xl font-bold text-purple-600">{quadrants.highPotential}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Emerging</p>
                <p className="text-xl font-bold text-orange-600">{quadrants.emerging}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Scatter Plot */}
      <Card>
        <CardHeader>
          <CardTitle>Collaboration Opportunity Matrix</CardTitle>
          <CardDescription>
            Each point represents a brand - size indicates location proximity, color shows trend direction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart data={enrichedData} margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                
                {/* Quadrant lines */}
                <defs>
                  <line id="vertical-line" x1="70%" y1="0%" x2="70%" y2="100%" stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" opacity={0.5} />
                  <line id="horizontal-line" x1="0%" y1="70%" x2="100%" y2="70%" stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" opacity={0.5} />
                </defs>
                
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Cultural Alignment"
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: 'Cultural Alignment Score →', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Collaboration Potential"
                  domain={[0, 100]}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  label={{ value: '↑ Collaboration Potential Score', angle: -90, position: 'insideLeft' }}
                />
                
                <Tooltip content={<CustomTooltip />} />
                
                <Scatter name="Brands" dataKey="y">
                  {enrichedData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.fill}
                      onClick={() => onBrandSelect && onBrandSelect(entry.brand_name)}
                      style={{ cursor: onBrandSelect ? 'pointer' : 'default' }}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Sweet Spot Brands */}
      {quadrants.sweetSpot > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              Sweet Spot Opportunities
            </CardTitle>
            <CardDescription>Brands with high alignment and collaboration potential</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {enrichedData
                .filter(brand => brand.x >= 70 && brand.y >= 70)
                .sort((a, b) => (b.x + b.y) - (a.x + a.y))
                .slice(0, 6)
                .map((brand) => (
                  <div key={brand.brand_name} className="p-4 border rounded-lg bg-green-50 border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{brand.brand_name}</span>
                      <Badge className="bg-green-100 text-green-800">
                        {((brand.x + brand.y) / 2).toFixed(0)}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Alignment:</span>
                        <span>{brand.alignment_score}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Potential:</span>
                        <span>{brand.collaboration_potential_score.toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Trend:</span>
                        <Badge 
                          variant="secondary"
                          style={{ backgroundColor: brand.fill + '20', color: brand.fill }}
                        >
                          {brand.trend_direction}
                        </Badge>
                      </div>
                    </div>
                    {onBrandSelect && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-3"
                        onClick={() => onBrandSelect(brand.brand_name)}
                      >
                        View Details
                      </Button>
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