import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GeoAnalysisRequest {
  brandProfileId: string;
  matchedBrands: any[];
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

    const { brandProfileId, matchedBrands } = await req.json() as GeoAnalysisRequest;

    console.log(`Starting geo-context analysis for brand profile: ${brandProfileId}`);

    // Get the brand profile with location data
    const { data: brandProfile, error: profileError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', brandProfileId)
      .single();

    if (profileError || !brandProfile) {
      console.error('Error fetching brand profile:', profileError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch brand profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const locationInsights = [];

    for (const matchedBrand of matchedBrands) {
      try {
        // Extract location information from the matched brand
        const brandLocation = extractLocationFromBrand(matchedBrand);
        
        if (brandLocation && brandProfile.city_region && brandProfile.country) {
          const locationRelevance = calculateLocationRelevance(
            brandProfile,
            brandLocation
          );

          const insight = {
            brand_profile_id: brandProfileId,
            matched_brand_name: matchedBrand.brand_name || matchedBrand.name,
            distance_km: locationRelevance.distance,
            location_relevance_score: locationRelevance.relevanceScore,
            same_city: locationRelevance.sameCity,
            same_country: locationRelevance.sameCountry,
            collaboration_potential: determineCollaborationPotential(locationRelevance),
            local_opportunities: generateLocalOpportunities(brandProfile, brandLocation, locationRelevance)
          };

          locationInsights.push(insight);

          // Store in database
          const { error: insertError } = await supabase
            .from('brand_location_insights')
            .upsert(insight);

          if (insertError) {
            console.error('Error storing location insight:', insertError);
          }
        }
      } catch (error) {
        console.error(`Error processing brand ${matchedBrand.brand_name}:`, error);
      }
    }

    // Calculate geo priority scores for the matched brands
    const geoPriorityResults = calculateGeoPriorityScores(locationInsights, matchedBrands);

    console.log(`Completed geo-context analysis for ${locationInsights.length} brands`);

    return new Response(
      JSON.stringify({
        success: true,
        location_insights: locationInsights,
        geo_priority_results: geoPriorityResults,
        brand_location: {
          city: brandProfile.city_region,
          country: brandProfile.country,
          latitude: brandProfile.latitude,
          longitude: brandProfile.longitude
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in analyze-geo-context function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function extractLocationFromBrand(brand: any): any {
  // Try to extract location from various fields
  const location = brand.location || brand.headquarters || brand.city || brand.country;
  
  if (!location) return null;
  
  // Simple location parsing - in production you'd use a proper geocoding service
  const locationStr = String(location).toLowerCase();
  
  // Extract city and country if possible
  const parts = locationStr.split(',').map(p => p.trim());
  
  return {
    city: parts[0] || '',
    country: parts[parts.length - 1] || '',
    full_location: location
  };
}

function calculateLocationRelevance(brandProfile: any, brandLocation: any): any {
  const profileCity = (brandProfile.city_region || '').toLowerCase();
  const profileCountry = (brandProfile.country || '').toLowerCase();
  const brandCity = (brandLocation.city || '').toLowerCase();
  const brandCountry = (brandLocation.country || '').toLowerCase();

  const sameCity = profileCity && brandCity && profileCity.includes(brandCity) || brandCity.includes(profileCity);
  const sameCountry = profileCountry && brandCountry && (profileCountry === brandCountry || 
    profileCountry.includes(brandCountry) || brandCountry.includes(profileCountry));

  let relevanceScore = 0;
  let distance = null;

  if (sameCity) {
    relevanceScore = 100;
    distance = 0;
  } else if (sameCountry) {
    relevanceScore = 75;
    distance = 50; // Estimated average distance within country
  } else {
    relevanceScore = 25;
    distance = 500; // Estimated international distance
  }

  return {
    sameCity,
    sameCountry,
    relevanceScore,
    distance
  };
}

function determineCollaborationPotential(locationRelevance: any): string {
  if (locationRelevance.sameCity) return 'high';
  if (locationRelevance.sameCountry) return 'medium';
  return 'low';
}

function generateLocalOpportunities(brandProfile: any, brandLocation: any, locationRelevance: any): any {
  const opportunities = [];

  if (locationRelevance.sameCity) {
    opportunities.push({
      type: 'local_event',
      description: 'Co-host local popup events or workshops',
      feasibility: 'high'
    });
    opportunities.push({
      type: 'shared_retail',
      description: 'Share retail space or cross-promote in local stores',
      feasibility: 'high'
    });
  }

  if (locationRelevance.sameCountry) {
    opportunities.push({
      type: 'regional_campaign',
      description: 'Launch joint regional marketing campaigns',
      feasibility: 'medium'
    });
    opportunities.push({
      type: 'distribution_partnership',
      description: 'Share distribution networks and logistics',
      feasibility: 'medium'
    });
  }

  opportunities.push({
    type: 'digital_collaboration',
    description: 'Virtual collaborations and digital co-marketing',
    feasibility: 'high'
  });

  return opportunities;
}

function calculateGeoPriorityScores(locationInsights: any[], matchedBrands: any[]): any[] {
  return matchedBrands.map(brand => {
    const insight = locationInsights.find(li => 
      li.matched_brand_name === (brand.brand_name || brand.name)
    );

    const baseScore = brand.cultural_alignment_score || brand.match_score || 0;
    let geoPriorityScore = baseScore;

    if (insight) {
      // Boost score based on location relevance
      const locationBoost = insight.location_relevance_score * 0.1; // 10% max boost
      geoPriorityScore = Math.min(100, baseScore + locationBoost);
    }

    return {
      brand_name: brand.brand_name || brand.name,
      base_score: baseScore,
      geo_priority_score: Math.round(geoPriorityScore * 100) / 100,
      location_boost: insight ? insight.location_relevance_score : 0,
      collaboration_potential: insight ? insight.collaboration_potential : 'low'
    };
  });
}