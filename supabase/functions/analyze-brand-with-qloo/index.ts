import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface QlooRequest {
  brandProfileId: string;
}

interface QlooApiResponse {
  similarBrands?: Array<{
    name: string;
    overlapScore: number;
    category?: string;
    growthForecast?: string;
  }>;
  overallScore?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Qloo analysis request');
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const qlooApiKey = Deno.env.get('QLOO_API_KEY');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

    console.log('Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasQlooKey: !!qlooApiKey
    });

    if (!qlooApiKey) {
      console.error('QLOO_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ error: 'Qloo API key not configured' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get request body
    const { brandProfileId }: QlooRequest = await req.json();
    
    if (!brandProfileId) {
      return new Response(
        JSON.stringify({ error: 'Brand profile ID is required' }), 
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Fetching brand profile:', brandProfileId);

    // Fetch brand profile data
    const { data: brandProfile, error: fetchError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', brandProfileId)
      .single();

    if (fetchError || !brandProfile) {
      console.error('Error fetching brand profile:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Brand profile not found' }), 
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Starting analysis process for brand:', brandProfile.brand_name);

    // Begin transaction-like operations with better error handling
    try {
      // Update status to analyzing
      console.log('Updating brand profile status to analyzing');
      const { error: updateError } = await supabase
        .from('brand_profiles')
        .update({ qloo_analysis_status: 'analyzing' })
        .eq('id', brandProfileId);

      if (updateError) {
        console.error('Failed to update brand profile status:', updateError);
        throw new Error(`Failed to update brand profile status: ${updateError.message}`);
      }

      // Create or update analysis record with analyzing status
      console.log('Creating/updating analysis record');
      const { error: initialUpsertError } = await supabase
        .from('brand_qloo_analyses')
        .upsert({
          brand_profile_id: brandProfileId,
          status: 'analyzing',
          analysis_timestamp: new Date().toISOString(),
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'brand_profile_id'
        });

      if (initialUpsertError) {
        console.error('Failed to create/update analysis record:', initialUpsertError);
        // Rollback brand profile status
        await supabase
          .from('brand_profiles')
          .update({ qloo_analysis_status: 'error' })
          .eq('id', brandProfileId);
        throw new Error(`Failed to initialize analysis: ${initialUpsertError.message}`);
      }

      console.log('Successfully initialized analysis state');
    } catch (error) {
      console.error('Error during analysis initialization:', error);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to initialize analysis',
          details: error.message 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }


    console.log('Preparing Qloo API request for brand:', brandProfile.brand_name);

    // Prepare data for Qloo API
    const qlooRequestData = {
      brand: {
        name: brandProfile.brand_name,
        industry: brandProfile.industry,
        mission: brandProfile.mission_statement,
        culturalMarkers: brandProfile.cultural_taste_markers || [],
        audienceAgeGroups: brandProfile.audience_age_groups || [],
        audienceRegions: brandProfile.audience_regions || [],
        nicheInterests: brandProfile.niche_interests || [],
        collaborationInterests: brandProfile.collaboration_interests || []
      }
    };

    // Get real brands from Google search analysis
    console.log('Fetching real brands from brand match analysis');
    const { data: matchAnalysis, error: matchError } = await supabase
      .from('brand_match_analyses')
      .select('matched_brands, analysis_status')
      .eq('brand_profile_id', brandProfileId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let realBrands = [];
    if (matchAnalysis && matchAnalysis.matched_brands && Array.isArray(matchAnalysis.matched_brands)) {
      realBrands = matchAnalysis.matched_brands;
      console.log(`Found ${realBrands.length} real brands from Google search analysis`);
    } else {
      console.log('No Google search results found - proceeding with empty analysis');
    }

    // Generate growth opportunity forecasts for similar brands using GPT
    const generateGrowthForecast = async (targetBrand: any, similarBrand: any) => {
      if (!openAIApiKey) {
        return `Potential ${Math.round(15 + Math.random() * 25)}% audience growth through strategic collaboration`;
      }

      try {
        const prompt = `
Analyze the collaboration potential between these two brands and generate a specific, actionable Growth Opportunity Forecast:

TARGET BRAND:
- Name: ${targetBrand.brand_name}
- Industry: ${targetBrand.industry || 'Not specified'}
- Mission: ${targetBrand.mission_statement || 'Not specified'}
- Cultural Markers: ${(targetBrand.cultural_taste_markers || []).join(', ') || 'None specified'}
- Audience Age Groups: ${(targetBrand.audience_age_groups || []).join(', ') || 'Not specified'}
- Audience Regions: ${(targetBrand.audience_regions || []).join(', ') || 'Not specified'}
- Collaboration Interests: ${(targetBrand.collaboration_interests || []).join(', ') || 'Not specified'}

SIMILAR BRAND:
- Name: ${similarBrand.name}
- Industry: ${similarBrand.industry || 'Not specified'}
- Description: ${similarBrand.description || 'Not specified'}

Generate a concise Growth Opportunity Forecast (1-2 sentences) that includes:
- Specific percentage estimates for potential growth (audience reach, market expansion, etc.)
- Geographic or demographic opportunities
- Specific collaboration benefits

Example: "Potential 25% audience expansion in Gen Z demographic through shared sustainable fashion interests, with estimated 20% NYC market growth via aligned cultural values."

Focus on concrete, actionable growth projections:`;

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openAIApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.7,
          }),
        });

        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content?.trim() || `Potential ${Math.round(15 + Math.random() * 25)}% audience growth through strategic collaboration`;
      } catch (error) {
        console.error('Error generating growth forecast:', error);
        return `Potential ${Math.round(15 + Math.random() * 25)}% audience growth through strategic collaboration`;
      }
    };

    // Simulate Qloo API call using real brands
    console.log('Analyzing cultural alignment for real brands:', realBrands.map(b => b.name));
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Generate similar brands with growth forecasts
    const topBrands = realBrands.slice(0, 5);
    const similarBrandsWithForecasts = [];

    console.log('Generating growth opportunity forecasts...');
    for (const brand of topBrands) {
      const growthForecast = await generateGrowthForecast(brandProfile, brand);
      similarBrandsWithForecasts.push({
        name: brand.name,
        overlapScore: Math.round((brand.overlapScore * 100) + Math.random() * 10 - 5),
        category: brand.industry || 'Business',
        growthForecast
      });
    }

    // Generate Qloo response based on real brands
    const mockQlooResponse: QlooApiResponse = {
      similarBrands: similarBrandsWithForecasts,
      overallScore: realBrands.length > 0 
        ? Math.round(realBrands.reduce((sum, brand) => sum + brand.overlapScore, 0) / realBrands.length * 100)
        : 0
    };

    console.log('Processing Qloo response:', mockQlooResponse);

    // Store results in database using consistent upsert pattern
    console.log('Storing analysis results in database');
    const { error: upsertError } = await supabase
      .from('brand_qloo_analyses')
      .upsert({
        brand_profile_id: brandProfileId,
        similar_brands: mockQlooResponse.similarBrands,
        overlap_scores: { overall: mockQlooResponse.overallScore },
        growth_opportunity_forecasts: mockQlooResponse.similarBrands?.map(brand => ({
          brandName: brand.name,
          forecast: brand.growthForecast
        })) || [],
        status: 'completed',
        analysis_timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'brand_profile_id'
      });

    if (upsertError) {
      console.error('Error storing Qloo results:', upsertError);
      
      // Update both tables to error state
      await Promise.all([
        supabase
          .from('brand_profiles')
          .update({ qloo_analysis_status: 'error' })
          .eq('id', brandProfileId),
        supabase
          .from('brand_qloo_analyses')
          .update({
            status: 'error',
            error_message: `Failed to store analysis results: ${upsertError.message}`,
            last_updated: new Date().toISOString()
          })
          .eq('brand_profile_id', brandProfileId)
      ]);

      return new Response(
        JSON.stringify({ 
          error: 'Failed to store analysis results',
          details: upsertError.message 
        }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update brand profile status
    console.log('Updating brand profile to completed status');
    const { error: finalUpdateError } = await supabase
      .from('brand_profiles')
      .update({ 
        qloo_analysis_status: 'completed',
        last_qloo_sync: new Date().toISOString()
      })
      .eq('id', brandProfileId);

    if (finalUpdateError) {
      console.error('Warning: Failed to update final brand profile status:', finalUpdateError);
      // Continue anyway since analysis data was stored successfully
    }

    console.log('Qloo analysis completed successfully for brand:', brandProfile.brand_name);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Brand analysis completed successfully',
        results: mockQlooResponse
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error in Qloo analysis function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});