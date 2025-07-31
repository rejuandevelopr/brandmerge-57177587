import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ChartDataRequest {
  brandProfileId: string;
  chartType: 'alignment' | 'trends' | 'geographic' | 'collaboration';
  timeRange?: 'week' | 'month' | 'quarter' | 'year';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { brandProfileId, chartType, timeRange = 'month' } = await req.json() as ChartDataRequest;

    console.log(`Generating ${chartType} chart data for brand: ${brandProfileId}`);

    // Calculate time range filter
    const timeRangeMap = {
      week: 7,
      month: 30,
      quarter: 90,
      year: 365
    };
    const daysBack = timeRangeMap[timeRange];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    let chartData: any = {};

    switch (chartType) {
      case 'alignment':
        chartData = await generateAlignmentChartData(supabase, brandProfileId, cutoffDate);
        break;
      
      case 'trends':
        chartData = await generateTrendsChartData(supabase, brandProfileId, cutoffDate);
        break;
      
      case 'geographic':
        chartData = await generateGeographicChartData(supabase, brandProfileId);
        break;
      
      case 'collaboration':
        chartData = await generateCollaborationChartData(supabase, brandProfileId, cutoffDate);
        break;
      
      default:
        throw new Error(`Unsupported chart type: ${chartType}`);
    }

    console.log(`Successfully generated ${chartType} chart data`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        chartType,
        timeRange,
        data: chartData,
        generatedAt: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error generating chart data:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate chart data',
        details: error.message
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }, 
        status: 500 
      }
    );
  }
});

async function generateAlignmentChartData(supabase: any, brandProfileId: string, cutoffDate: Date) {
  // Get historical analysis data
  const { data: analysisHistory } = await supabase
    .from('brand_analysis_history')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: true });

  // Get current Qloo analysis for comparison
  const { data: qlooAnalysis } = await supabase
    .from('brand_qloo_analyses')
    .select('overlap_scores, analysis_timestamp')
    .eq('brand_profile_id', brandProfileId)
    .gte('analysis_timestamp', cutoffDate.toISOString())
    .order('analysis_timestamp', { ascending: true });

  // Transform data for chart
  const alignmentData = [];
  
  // Add historical data points
  if (analysisHistory) {
    for (const analysis of analysisHistory) {
      const analysisData = analysis.analysis_data || {};
      const matchedBrands = analysisData.matched_brands || [];
      
      if (matchedBrands.length > 0) {
        const avgScore = matchedBrands.reduce((sum: number, brand: any) => 
          sum + (brand.alignment_score || 0), 0) / matchedBrands.length;
        
        alignmentData.push({
          date: analysis.analysis_timestamp,
          alignment_score: Math.round(avgScore),
          trend_direction: 'stable' // Default for historical data
        });
      }
    }
  }

  // Add Qloo data points
  if (qlooAnalysis) {
    for (const qloo of qlooAnalysis) {
      const overlapScores = qloo.overlap_scores || {};
      const avgQlooScore = Object.values(overlapScores).length > 0 
        ? Object.values(overlapScores).reduce((sum: any, score: any) => sum + score, 0) / Object.values(overlapScores).length
        : 0;
      
      // Find matching alignment data point or create new one
      const existingPoint = alignmentData.find(point => 
        new Date(point.date).toDateString() === new Date(qloo.analysis_timestamp).toDateString());
      
      if (existingPoint) {
        existingPoint.qloo_score = Math.round(avgQlooScore as number);
      } else {
        alignmentData.push({
          date: qloo.analysis_timestamp,
          alignment_score: Math.round(avgQlooScore as number),
          qloo_score: Math.round(avgQlooScore as number),
          trend_direction: 'stable'
        });
      }
    }
  }

  return alignmentData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

async function generateTrendsChartData(supabase: any, brandProfileId: string, cutoffDate: Date) {
  const { data: trendData } = await supabase
    .from('brand_trend_analytics')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .gte('trend_analysis_date', cutoffDate.toISOString())
    .order('trend_analysis_date', { ascending: false });

  if (!trendData) return [];

  return trendData.map((trend: any) => ({
    brand_name: trend.matched_brand_name,
    trend_direction: trend.trend_direction,
    current_score: trend.current_score || 0,
    previous_score: trend.previous_score,
    trend_percentage: trend.trend_percentage || 0,
    analysis_date: trend.trend_analysis_date
  }));
}

async function generateGeographicChartData(supabase: any, brandProfileId: string) {
  // Get brand's location
  const { data: brandProfile } = await supabase
    .from('brand_profiles')
    .select('city_region, country, latitude, longitude')
    .eq('id', brandProfileId)
    .single();

  // Get location insights
  const { data: locationInsights } = await supabase
    .from('brand_location_insights')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .order('location_relevance_score', { ascending: false });

  // Get latest match analysis for alignment scores
  const { data: matchAnalysis } = await supabase
    .from('brand_match_analyses')
    .select('matched_brands')
    .eq('brand_profile_id', brandProfileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const matchedBrands = matchAnalysis?.matched_brands || [];
  
  // Combine location and alignment data
  const locationData = [];
  
  if (locationInsights) {
    for (const insight of locationInsights) {
      // Find matching brand in match analysis
      const matchedBrand = matchedBrands.find((brand: any) => 
        brand.brand_name === insight.matched_brand_name);
      
      if (matchedBrand) {
        locationData.push({
          brand_name: insight.matched_brand_name,
          city: matchedBrand.city || null,
          country: matchedBrand.country || 'Unknown',
          latitude: matchedBrand.latitude,
          longitude: matchedBrand.longitude,
          alignment_score: matchedBrand.alignment_score || 0,
          same_city: insight.same_city,
          same_country: insight.same_country,
          distance_km: insight.distance_km,
          collaboration_potential: insight.collaboration_potential || 'medium'
        });
      }
    }
  }

  return {
    userBrandLocation: {
      city: brandProfile?.city_region,
      country: brandProfile?.country
    },
    locationData
  };
}

async function generateCollaborationChartData(supabase: any, brandProfileId: string, cutoffDate: Date) {
  // Get latest match analysis
  const { data: matchAnalysis } = await supabase
    .from('brand_match_analyses')
    .select('matched_brands')
    .eq('brand_profile_id', brandProfileId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Get location insights
  const { data: locationInsights } = await supabase
    .from('brand_location_insights')
    .select('*')
    .eq('brand_profile_id', brandProfileId);

  // Get trend analytics
  const { data: trendData } = await supabase
    .from('brand_trend_analytics')
    .select('*')
    .eq('brand_profile_id', brandProfileId)
    .gte('trend_analysis_date', cutoffDate.toISOString());

  // Get Qloo analysis for additional scoring
  const { data: qlooAnalysis } = await supabase
    .from('brand_qloo_analyses')
    .select('similar_brands, overlap_scores')
    .eq('brand_profile_id', brandProfileId)
    .order('analysis_timestamp', { ascending: false })
    .limit(1)
    .single();

  const matchedBrands = matchAnalysis?.matched_brands || [];
  const collaborationData = [];

  for (const brand of matchedBrands) {
    // Find location insight
    const locationInsight = locationInsights?.find((insight: any) => 
      insight.matched_brand_name === brand.brand_name);

    // Find trend data
    const trendInfo = trendData?.find((trend: any) => 
      trend.matched_brand_name === brand.brand_name);

    // Find Qloo score
    const qlooSimilar = qlooAnalysis?.similar_brands?.find((similar: any) => 
      similar.brand_name === brand.brand_name);

    collaborationData.push({
      brand_name: brand.brand_name,
      alignment_score: brand.alignment_score || 0,
      collaboration_potential_score: 0, // Will be calculated in component
      industry: brand.industry,
      location_relevance: locationInsight?.location_relevance_score || 0,
      trend_direction: trendInfo?.trend_direction || 'stable',
      qloo_score: qlooSimilar?.overlap_score,
      same_city: locationInsight?.same_city || false,
      same_country: locationInsight?.same_country || false
    });
  }

  return collaborationData;
}