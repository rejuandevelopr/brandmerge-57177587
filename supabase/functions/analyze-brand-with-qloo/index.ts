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

    // Update status to analyzing
    await supabase
      .from('brand_profiles')
      .update({ qloo_analysis_status: 'analyzing' })
      .eq('id', brandProfileId);

    // Create or update analysis record with analyzing status
    await supabase
      .from('brand_qloo_analyses')
      .upsert({
        brand_profile_id: brandProfileId,
        status: 'analyzing',
        analysis_timestamp: new Date().toISOString()
      });

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
    const { error: upsertError } = await supabase
      .from('brand_qloo_analyses')
      .upsert({
        brand_profile_id: brandProfileId,
        similar_brands: mockQlooResponse.similarBrands,
        overlap_scores: { overall: mockQlooResponse.overallScore },
        status: 'completed',
        analysis_timestamp: new Date().toISOString(),
        last_updated: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Error storing Qloo results:', upsertError);
      
      // Update status to error
      await supabase
        .from('brand_profiles')
        .update({ qloo_analysis_status: 'error' })
        .eq('id', brandProfileId);

      await supabase
        .from('brand_qloo_analyses')
        .upsert({
          brand_profile_id: brandProfileId,
          status: 'error',
          error_message: 'Failed to store analysis results'
        });

      return new Response(
        JSON.stringify({ error: 'Failed to store analysis results' }), 
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Update brand profile status
    await supabase
      .from('brand_profiles')
      .update({ 
        qloo_analysis_status: 'completed',
        last_qloo_sync: new Date().toISOString()
      })
      .eq('id', brandProfileId);

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