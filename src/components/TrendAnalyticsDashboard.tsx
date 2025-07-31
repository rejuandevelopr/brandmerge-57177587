import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";

interface TrendData {
  brand_name: string;
  trend_direction: 'rising' | 'falling' | 'stable' | 'new';
  current_score: number;
  previous_score?: number;
  trend_percentage: number;
  analysis_date: string;
}

interface TrendSummary {
  rising: number;
  falling: number;
  stable: number;
  new: number;
}

interface TrendAnalyticsDashboardProps {
  trendData: TrendData[];
  isLoading?: boolean;
  brandName: string;
}

const chartConfig = {
  current_score: {
    label: "Current Score",
    color: "hsl(var(--primary))",
  },
  previous_score: {
    label: "Previous Score",
    color: "hsl(var(--muted))",
  },
  trend_percentage: {
    label: "Trend %",
    color: "hsl(var(--secondary))",
  },
};

const trendColors = {
  rising: "hsl(var(--success))",
  falling: "hsl(var(--destructive))",
  stable: "hsl(var(--muted))",
  new: "hsl(var(--primary))",
};

const getTrendIcon = (direction: string) => {
  switch (direction) {
    case 'rising': return <TrendingUp className="h-4 w-4" />;
    case 'falling': return <TrendingDown className="h-4 w-4" />;
    case 'new': return <Sparkles className="h-4 w-4" />;
    default: return <Minus className="h-4 w-4" />;
  }
};

export const TrendAnalyticsDashboard: React.FC<TrendAnalyticsDashboardProps> = ({
  trendData,
  isLoading,
  brandName
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-6 bg-muted animate-pulse rounded"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const trendSummary: TrendSummary = trendData.reduce(
    (acc, item) => {
      acc[item.trend_direction as keyof TrendSummary]++;
      return acc;
    },
    { rising: 0, falling: 0, stable: 0, new: 0 }
  );

  const pieData = Object.entries(trendSummary)
    .filter(([_, count]) => count > 0)
    .map(([direction, count]) => ({
      name: direction.charAt(0).toUpperCase() + direction.slice(1),
      value: count,
      color: trendColors[direction as keyof typeof trendColors],
    }));

  const topTrending = [...trendData]
    .sort((a, b) => Math.abs(b.trend_percentage) - Math.abs(a.trend_percentage))
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trend Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Trend Distribution</CardTitle>
            <CardDescription>Brand movement patterns for {brandName}</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Score Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Score Evolution</CardTitle>
            <CardDescription>Current vs previous alignment scores</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTrending.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="brand_name" 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={10}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="current_score" fill="var(--color-current_score)" radius={2} />
                  <Bar dataKey="previous_score" fill="var(--color-previous_score)" radius={2} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Changes Over Time */}
      <Card>
        <CardHeader>
          <CardTitle>Trend Analysis Timeline</CardTitle>
          <CardDescription>Score changes and trend percentages over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={topTrending}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="brand_name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="current_score"
                  stackId="1"
                  stroke="var(--color-current_score)"
                  fill="var(--color-current_score)"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="trend_percentage"
                  stackId="2"
                  stroke="var(--color-trend_percentage)"
                  fill="var(--color-trend_percentage)"
                  fillOpacity={0.4}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Top Trending Brands */}
      <Card>
        <CardHeader>
          <CardTitle>Most Dynamic Trends</CardTitle>
          <CardDescription>Brands with the highest trend percentage changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topTrending.slice(0, 8).map((brand, index) => (
              <div key={brand.brand_name} className="flex items-center justify-between p-2 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    {getTrendIcon(brand.trend_direction)}
                    <span className="font-medium text-sm">{brand.brand_name}</span>
                  </div>
                  <Badge 
                    variant="secondary"
                    className="text-xs"
                    style={{ 
                      backgroundColor: `${trendColors[brand.trend_direction as keyof typeof trendColors]}20`,
                      color: trendColors[brand.trend_direction as keyof typeof trendColors]
                    }}
                  >
                    {brand.trend_direction}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-muted-foreground">
                    Score: {brand.current_score}
                  </span>
                  <span 
                    className={`font-medium ${
                      brand.trend_percentage > 0 ? 'text-green-600' : 
                      brand.trend_percentage < 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}
                  >
                    {brand.trend_percentage > 0 ? '+' : ''}{brand.trend_percentage.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};