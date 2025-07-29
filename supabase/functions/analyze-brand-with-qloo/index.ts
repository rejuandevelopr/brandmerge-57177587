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

    // For demo purposes, we'll simulate the Qloo API response
    // In a real implementation, you would call the actual Qloo API
    console.log('Simulating Qloo API call with data:', qlooRequestData);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock response based on brand data
    const mockQlooResponse: QlooApiResponse = {
      similarBrands: [
        { name: "Nike", overlapScore: 85, category: "Athletic Lifestyle" },
        { name: "Patagonia", overlapScore: 72, category: "Outdoor Adventure" },
        { name: "Apple", overlapScore: 68, category: "Innovation Tech" },
        { name: "Spotify", overlapScore: 65, category: "Music Culture" },
        { name: "Tesla", overlapScore: 62, category: "Future Mobility" }
      ].filter(brand => {
        // Filter based on cultural markers and interests
        const markers = brandProfile.cultural_taste_markers || [];
        const interests = brandProfile.niche_interests || [];
        
        // Simple matching logic for demo
        if (markers.includes('technology') && brand.category.includes('Tech')) return true;
        if (markers.includes('sustainability') && brand.name === 'Patagonia') return true;
        if (interests.includes('fitness') && brand.name === 'Nike') return true;
        if (markers.includes('music') && brand.name === 'Spotify') return true;
        
        return Math.random() > 0.3; // Random selection for demo
      }).slice(0, 5),
      overallScore: Math.floor(Math.random() * 20) + 70 // Random score 70-90
    };

    console.log('Processing Qloo response:', mockQlooResponse);

    // Store results in database
    console.log('Storing analysis results in database');
    const { error: upsertError } = await supabase
      .from('brand_qloo_analyses')
      .update({
        similar_brands: mockQlooResponse.similarBrands,
        overlap_scores: { overall: mockQlooResponse.overallScore },
        status: 'completed',
        last_updated: new Date().toISOString()
      })
      .eq('brand_profile_id', brandProfileId);

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