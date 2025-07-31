import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get API keys
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('Missing required API key: OPENAI_API_KEY');
    }

    const { brandProfileId, analysisType = 'comprehensive' } = await req.json();

    // Fetch brand profile data
    const { data: brandData, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', brandProfileId)
      .single();

    if (brandError || !brandData) {
      throw new Error('Brand profile not found');
    }

    // Fetch Qloo analysis data
    const { data: qlooData } = await supabase
      .from('brand_qloo_analyses')
      .select('*')
      .eq('brand_profile_id', brandProfileId)
      .single();

    // Fetch trending startups in the same industry
    const { data: trendingData } = await supabase
      .from('trending_startups')
      .select('*')
      .eq('industry', brandData.industry)
      .eq('is_active', true)
      .order('opportunity_score', { ascending: false })
      .limit(5);

    // Fetch recent partnership news
    const { data: partnershipData } = await supabase
      .from('partnership_news')
      .select('*')
      .order('announcement_date', { ascending: false })
      .limit(5);

    // Generate comprehensive market intelligence report
    const aiPrompt = `
    Generate a comprehensive market intelligence report for this brand:

    Brand Information:
    - Name: ${brandData.brand_name}
    - Industry: ${brandData.industry}
    - Mission: ${brandData.mission_statement}
    - Cultural Taste Markers: ${brandData.cultural_taste_markers?.join(', ') || 'None specified'}
    - Collaboration Interests: ${brandData.collaboration_interests?.join(', ') || 'None specified'}

    Qloo Analysis Results:
    ${qlooData ? JSON.stringify(qlooData.similar_brands || [], null, 2) : 'No Qloo analysis available'}

    Trending Startups in Industry:
    ${trendingData ? JSON.stringify(trendingData.slice(0, 3), null, 2) : 'No trending data available'}

    Recent Partnership Examples:
    ${partnershipData ? JSON.stringify(partnershipData.slice(0, 3), null, 2) : 'No partnership data available'}

    Please provide a JSON response with:
    {
      "executive_summary": "Brief overview of market position and opportunities",
      "market_trends": [
        {
          "trend": "trend name",
          "description": "trend description", 
          "impact": "high/medium/low",
          "opportunity": "specific opportunity for this brand"
        }
      ],
      "competitive_landscape": {
        "direct_competitors": ["list of direct competitors"],
        "cultural_alignments": ["brands with cultural overlap"],
        "positioning_gaps": ["opportunities in market positioning"]
      },
      "partnership_opportunities": [
        {
          "category": "category name",
          "potential_partners": ["list of potential partners"],
          "collaboration_type": "type of collaboration",
          "success_probability": "high/medium/low",
          "reasoning": "why this would work"
        }
      ],
      "actionable_insights": [
        {
          "insight": "key insight",
          "action": "recommended action",
          "timeline": "immediate/short-term/long-term",
          "expected_impact": "description of expected impact"
        }
      ],
      "market_timing": {
        "current_sentiment": "market sentiment analysis",
        "best_timing": "when to act",
        "seasonal_factors": "relevant seasonal considerations"
      }
    }

    Focus on providing specific, actionable insights based on the data provided.
    `;

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a market intelligence analyst specializing in brand partnerships and collaboration strategies. Generate detailed, data-driven insights.' 
          },
          { role: 'user', content: aiPrompt }
        ],
        temperature: 0.7,
      }),
    });

    const aiData = await aiResponse.json();
    const report = JSON.parse(aiData.choices[0].message.content);

    // Store the intelligence report in a new table or return directly
    const intelligenceData = {
      brand_profile_id: brandProfileId,
      report_type: analysisType,
      report_data: report,
      generated_at: new Date().toISOString(),
      data_sources: {
        qloo_analysis: !!qlooData,
        trending_startups: trendingData?.length || 0,
        partnership_news: partnershipData?.length || 0
      }
    };

    // Log the report generation
    await supabase.from('data_refresh_log').insert({
      source_type: 'market_intelligence_report',
      search_query: `brand_${brandProfileId}_${analysisType}`,
      results_count: 1,
      status: 'success'
    });

    return new Response(JSON.stringify({ 
      success: true, 
      intelligence: intelligenceData 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-market-intelligence:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});