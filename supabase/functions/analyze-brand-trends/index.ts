import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TrendAnalysisRequest {
  brandProfileId: string;
  currentAnalysis?: any;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { brandProfileId, currentAnalysis } = await req.json() as TrendAnalysisRequest;

    console.log(`Starting trend analysis for brand profile: ${brandProfileId}`);

    // Get the most recent historical analysis for comparison
    const { data: historicalData, error: historyError } = await supabase
      .from('brand_analysis_history')
      .select('*')
      .eq('brand_profile_id', brandProfileId)
      .order('analysis_timestamp', { ascending: false })
      .limit(1);

    if (historyError) {
      console.error('Error fetching historical data:', historyError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch historical data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let trendResults = [];

    if (historicalData && historicalData.length > 0 && currentAnalysis) {
      const previousAnalysis = historicalData[0];
      const currentBrands = currentAnalysis.matched_brands || [];
      const previousBrands = previousAnalysis.analysis_data?.matched_brands || [];

      console.log(`Comparing ${currentBrands.length} current brands with ${previousBrands.length} previous brands`);

      // Compare each current brand with its previous score
      for (const currentBrand of currentBrands) {
        const previousBrand = previousBrands.find((pb: any) => pb.brand_name === currentBrand.brand_name);
        
        if (previousBrand) {
          const currentScore = currentBrand.cultural_alignment_score || currentBrand.match_score || 0;
          const previousScore = previousBrand.cultural_alignment_score || previousBrand.match_score || 0;
          
          const trendDirection = await calculateTrendDirection(previousScore, currentScore);
          const trendPercentage = previousScore > 0 ? ((currentScore - previousScore) / previousScore) * 100 : 0;

          // Store trend analytics
          const { error: trendError } = await supabase
            .from('brand_trend_analytics')
            .upsert({
              brand_profile_id: brandProfileId,
              matched_brand_name: currentBrand.brand_name,
              trend_direction: trendDirection,
              trend_percentage: Math.round(trendPercentage * 100) / 100,
              previous_score: previousScore,
              current_score: currentScore,
              trend_analysis_date: new Date().toISOString()
            });

          if (trendError) {
            console.error('Error storing trend analytics:', trendError);
          }

          trendResults.push({
            brand_name: currentBrand.brand_name,
            trend_direction: trendDirection,
            trend_percentage: Math.round(trendPercentage * 100) / 100,
            previous_score: previousScore,
            current_score: currentScore,
            is_new: false
          });
        } else {
          // New brand discovered
          trendResults.push({
            brand_name: currentBrand.brand_name,
            trend_direction: 'new',
            trend_percentage: 0,
            previous_score: null,
            current_score: currentBrand.cultural_alignment_score || currentBrand.match_score || 0,
            is_new: true
          });
        }
      }

      // Update the current analysis with trend information
      if (currentAnalysis.id) {
        const { error: updateError } = await supabase
          .from('brand_match_analyses')
          .update({
            trend_direction: calculateOverallTrend(trendResults),
            updated_at: new Date().toISOString()
          })
          .eq('id', currentAnalysis.id);

        if (updateError) {
          console.error('Error updating analysis with trend:', updateError);
        }
      }
    }

    // Store current analysis in history for future comparisons
    if (currentAnalysis) {
      const { error: historyInsertError } = await supabase
        .from('brand_analysis_history')
        .insert({
          brand_profile_id: brandProfileId,
          analysis_type: 'discovery',
          analysis_data: currentAnalysis,
          overlap_scores: null,
          match_count: currentAnalysis.matched_brands?.length || 0,
          analysis_timestamp: new Date().toISOString()
        });

      if (historyInsertError) {
        console.error('Error storing analysis history:', historyInsertError);
      }
    }

    console.log(`Completed trend analysis with ${trendResults.length} brand comparisons`);

    return new Response(
      JSON.stringify({
        success: true,
        trends: trendResults,
        has_historical_data: historicalData && historicalData.length > 0,
        analysis_timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-brand-trends function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function calculateTrendDirection(previousScore: number, currentScore: number): Promise<string> {
  if (!previousScore) return 'stable';
  
  const difference = currentScore - previousScore;
  const percentageChange = (difference / previousScore) * 100;
  
  if (percentageChange > 5) return 'rising';
  if (percentageChange < -5) return 'falling';
  return 'stable';
}

function calculateOverallTrend(trends: any[]): string {
  const risingCount = trends.filter(t => t.trend_direction === 'rising').length;
  const fallingCount = trends.filter(t => t.trend_direction === 'falling').length;
  const newCount = trends.filter(t => t.trend_direction === 'new').length;
  
  if (risingCount + newCount > fallingCount) return 'rising';
  if (fallingCount > risingCount + newCount) return 'falling';
  return 'stable';
}