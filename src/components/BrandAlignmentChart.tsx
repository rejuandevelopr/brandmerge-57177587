import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AlignmentDataPoint {
  date: string;
  alignment_score: number;
  qloo_score?: number;
  trend_direction: 'rising' | 'falling' | 'stable';
}

interface BrandAlignmentChartProps {
  data: AlignmentDataPoint[];
  isLoading?: boolean;
  brandName: string;
}

const chartConfig = {
  alignment_score: {
    label: "Cultural Alignment",
    color: "hsl(var(--primary))",
  },
  qloo_score: {
    label: "Qloo Score",
    color: "hsl(var(--secondary))",
  },
};

export const BrandAlignmentChart: React.FC<BrandAlignmentChartProps> = ({
  data,
  isLoading,
  brandName
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cultural Alignment Over Time</CardTitle>
          <CardDescription>Tracking alignment evolution for {brandName}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded-md"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cultural Alignment Over Time</CardTitle>
        <CardDescription>Tracking alignment evolution for {brandName}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip 
                content={
                  <ChartTooltipContent 
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value, name) => [
                      `${value}%`,
                      chartConfig[name as keyof typeof chartConfig]?.label
                    ]}
                  />
                }
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="alignment_score"
                stroke="var(--color-alignment_score)"
                strokeWidth={2}
                dot={{ fill: "var(--color-alignment_score)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: "var(--color-alignment_score)", strokeWidth: 2 }}
              />
              {data.some(d => d.qloo_score) && (
                <Line
                  type="monotone"
                  dataKey="qloo_score"
                  stroke="var(--color-qloo_score)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: "var(--color-qloo_score)", strokeWidth: 2, r: 4 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};