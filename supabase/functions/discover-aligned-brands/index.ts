import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandDiscoveryRequest {
  brandProfileId: string;
  brandCount?: number;
}

interface DiscoveredBrand {
  name: string;
  industry: string;
  location: string;
  culturalTasteMarkers: string[];
  collaborationInterests: string[];
  website?: string;
  description: string;
  matchScore: number;
  sourceUrl?: string;
  culturalAlignScore: number;
  collaborationPossibility: 'High' | 'Medium' | 'Low';
  collaborationDescription: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { brandProfileId, brandCount = 15 } = await req.json() as BrandDiscoveryRequest;

    console.log(`Starting ChatGPT brand discovery for brand profile: ${brandProfileId}`);

    // Fetch brand profile data
    const { data: brandProfile, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', brandProfileId)
      .single();

    if (brandError || !brandProfile) {
      throw new Error(`Failed to fetch brand profile: ${brandError?.message}`);
    }

    // Create analysis session
    const { data: session, error: sessionError } = await supabase
      .from('brand_analysis_sessions')
      .insert({
        brand_profile_id: brandProfileId,
        session_status: 'analyzing'
      })
      .select()
      .single();

    if (sessionError) {
      throw new Error(`Failed to create analysis session: ${sessionError.message}`);
    }

    // Use ChatGPT to discover aligned brands
    const discoveredBrands = await discoverBrandsWithChatGPT(brandProfile, openaiApiKey, brandCount);

    // Store results in database
    const { error: insertError } = await supabase
      .from('brand_match_analyses')
      .insert({
        brand_profile_id: brandProfileId,
        search_query: `ChatGPT brand discovery for ${brandProfile.brand_name}`,
        matched_brands: discoveredBrands.map(brand => ({
          name: brand.name,
          industry: brand.industry,
          location: brand.location,
          website: brand.website || '',
          description: brand.description,
          matchType: determineMatchType(brand, brandProfile),
          overlapScore: brand.matchScore / 100,
          culturalAlignScore: brand.culturalAlignScore,
          collaborationPossibility: brand.collaborationPossibility,
          collaborationDescription: brand.collaborationDescription
        })),
        analysis_status: 'completed',
        match_count: discoveredBrands.length,
        location_filter: brandProfile.country || brandProfile.city_region,
        industry_filter: brandProfile.industry,
        brand_count_requested: brandCount
      });

    if (insertError) {
      throw new Error(`Failed to store analysis results: ${insertError.message}`);
    }

    // Update session status
    await supabase
      .from('brand_analysis_sessions')
      .update({
        session_status: 'completed',
        completed_at: new Date().toISOString(),
        match_analysis_id: brandProfileId
      })
      .eq('id', session.id);

    console.log(`Successfully discovered ${discoveredBrands.length} aligned brands`);

    return new Response(JSON.stringify({
      success: true,
      matchCount: discoveredBrands.length,
      brands: discoveredBrands.slice(0, 10), // Return top 10 for immediate display
      sessionId: session.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in discover-aligned-brands function:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function discoverBrandsWithChatGPT(brandProfile: any, openaiApiKey: string, brandCount: number = 15): Promise<DiscoveredBrand[]> {
  const culturalMarkers = brandProfile.cultural_taste_markers?.join(', ') || '';
  const collaborationInterests = brandProfile.collaboration_interests?.join(', ') || '';
  const location = brandProfile.country || brandProfile.city_region || '';

  const prompt = `Find ${brandCount} real brands that could partner with "${brandProfile.brand_name}".

TARGET BRAND PROFILE:
- Name: ${brandProfile.brand_name}
- Industry: ${brandProfile.industry}
- Location: ${location}
- Mission: ${brandProfile.mission_statement}
- Cultural Markers: ${culturalMarkers}
- Collaboration Interests: ${collaborationInterests}

Find brands that:
1. Share similar values and target audiences
2. Are geographically accessible (prioritize ${location} and surrounding areas)
3. Could realistically collaborate (events, partnerships, cross-promotions)
4. Are complementary rather than direct competitors

Return ONLY a valid JSON array with this exact structure:
[
  {
    "name": "Brand Name",
    "industry": "Industry",
    "location": "City, Country",
    "culturalTasteMarkers": ["marker1", "marker2"],
    "collaborationInterests": ["type1", "type2"],
    "website": "https://website.com",
    "description": "Brief description",
    "matchScore": 75,
    "sourceUrl": "",
    "culturalAlignScore": 75,
    "collaborationPossibility": "High",
    "collaborationDescription": "Partnership potential"
  }
]

Return exactly ${brandCount} brands as a valid JSON array.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: 'You are a brand partnership expert. Return ONLY valid JSON arrays. Focus on real, existing brands.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 2500,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        // Simple JSON extraction and parsing
        const cleanContent = content.trim();
        let jsonString = cleanContent;
        
        // Extract JSON array if wrapped in other text
        const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
        
        const discoveredBrands = JSON.parse(jsonString);
        console.log(`ChatGPT discovered ${discoveredBrands.length} aligned brands`);
        
        // Simple validation and processing
        const validBrands = discoveredBrands.filter((brand: any) => 
          brand.name && 
          brand.industry && 
          brand.description && 
          typeof brand.matchScore === 'number' &&
          brand.matchScore >= 20 // Lowered threshold
        ).map((brand: any) => ({
          ...brand,
          matchScore: brand.matchScore || 75,
          culturalAlignScore: brand.culturalAlignScore || brand.matchScore || 75,
          collaborationPossibility: brand.collaborationPossibility || 'Medium',
          collaborationDescription: brand.collaborationDescription || 'Partnership potential'
        }));
        
        return Array.isArray(validBrands) ? validBrands : [];
      } catch (parseError) {
        console.error('Failed to parse ChatGPT response as JSON:', parseError);
        console.error('Response content:', content);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('ChatGPT API error:', error);
    return [];
  }
}

function determineMatchType(brand: DiscoveredBrand, brandProfile: any): string {
  // RESTRICTIVE location matching: only same city/metro area AND same country
  
  const brandLocation = (brand.location || '').toLowerCase().trim();
  const profileCountry = (brandProfile.country || '').toLowerCase().trim();
  const profileCity = (brandProfile.city_region || '').toLowerCase().trim();
  
  // Location matching - ONLY same city/metro area in same country
  if (brandLocation && (profileCountry || profileCity)) {
    
    // Parse location components for both brand and profile
    const brandParts = brandLocation.split(',').map(part => part.trim());
    const brandCity = brandParts[0] || '';
    const brandCountry = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';
    
    // Normalize country names for comparison
    const normalizeCountry = (country: string): string => {
      return country
        .replace(/\b(united states|usa|us|america|u\.s\.|u\.s\.a\.)\b/g, 'united states')
        .replace(/\b(united kingdom|uk|britain|england|great britain)\b/g, 'united kingdom')
        .replace(/\b(canada|ca)\b/g, 'canada')
        .trim();
    };
    
    const normalizedProfileCountry = normalizeCountry(profileCountry);
    const normalizedBrandCountry = normalizeCountry(brandCountry);
    
    // ONLY match if countries are the same
    if (normalizedProfileCountry && normalizedBrandCountry && 
        normalizedProfileCountry === normalizedBrandCountry) {
      
      // 1. EXACT CITY MATCHING
      if (profileCity && brandCity) {
        // Normalize city names
        const normalizeCity = (city: string): string => {
          return city
            .replace(/\b(new york|nyc|ny)\b/g, 'new york')
            .replace(/\b(los angeles|la)\b/g, 'los angeles')
            .replace(/\b(san francisco|sf)\b/g, 'san francisco')
            .trim();
        };
        
        const normalizedProfileCity = normalizeCity(profileCity);
        const normalizedBrandCity = normalizeCity(brandCity);
        
        if (normalizedProfileCity === normalizedBrandCity) {
          return 'location_based';
        }
      }
      
      // 2. METROPOLITAN AREA MATCHING (same metro area in same country)
      const metropolitanAreas = {
        'new york': ['new york', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'new york city'],
        'los angeles': ['los angeles', 'la', 'hollywood', 'beverly hills', 'santa monica', 'west hollywood', 'culver city', 'venice'],
        'san francisco': ['san francisco', 'sf', 'palo alto', 'mountain view', 'oakland', 'berkeley'],
        'boston': ['boston', 'cambridge', 'somerville', 'brookline'],
        'chicago': ['chicago', 'evanston', 'oak park'],
        'seattle': ['seattle', 'bellevue', 'redmond', 'kirkland']
      };
      
      for (const [metro, areas] of Object.entries(metropolitanAreas)) {
        const profileInMetro = areas.some(area => 
          profileCity.includes(area) || brandLocation.includes(area)
        );
        const brandInMetro = areas.some(area => brandLocation.includes(area));
        
        if (profileInMetro && brandInMetro) {
          return 'location_based';
        }
      }
    }
  }
  
  if (brand.industry === brandProfile.industry) {
    return 'industry_similar';
  }
  
  // Check for cultural alignment
  const profileMarkers = brandProfile.cultural_taste_markers || [];
  const brandMarkers = brand.culturalTasteMarkers || [];
  const hasCommonMarkers = profileMarkers.some((marker: string) => 
    brandMarkers.some((bMarker: string) => 
      bMarker.toLowerCase().includes(marker.toLowerCase()) ||
      marker.toLowerCase().includes(bMarker.toLowerCase())
    )
  );
  
  if (hasCommonMarkers) {
    return 'cultural_alignment';
  }
  
  return 'partnership_opportunity';
}

function determineCollaborationLevel(brand: any): 'High' | 'Medium' | 'Low' {
  const description = brand.description?.toLowerCase() || '';
  
  // High collaboration potential indicators
  if (description.includes('seeking partnerships') || 
      description.includes('recently funded') ||
      description.includes('series a') ||
      description.includes('open to collaborations')) {
    return 'High';
  }
  
  // Medium collaboration potential indicators
  if (description.includes('partnerships') || 
      description.includes('collaborations') ||
      description.includes('established') ||
      brand.matchScore > 70) {
    return 'Medium';
  }
  
  return 'Low';
}

function generateCollaborationDescription(brand: any): string {
  const level = brand.collaborationPossibility || determineCollaborationLevel(brand);
  const description = brand.description?.toLowerCase() || '';
  
  if (level === 'High') {
    if (description.includes('funded')) return 'Recently funded, actively seeking partnerships';
    if (description.includes('growing')) return 'High growth potential, open to collaborations';
    return 'Active partnership seeker';
  }
  
  if (level === 'Medium') {
    if (description.includes('established')) return 'Established brand, selective partnerships';
    return 'Open to strategic partnerships';
  }
  
  return 'Limited collaboration indicators';
}

function calculateGeographicBoost(brand: any, brandProfile: any): number {
  const brandLocation = (brand.location || '').toLowerCase().trim();
  const profileCountry = (brandProfile.country || '').toLowerCase().trim();
  const profileCity = (brandProfile.city_region || '').toLowerCase().trim();
  
  if (!brandLocation || (!profileCountry && !profileCity)) {
    return 0; // No geographic boost if location data is missing
  }
  
  // Parse brand location
  const brandParts = brandLocation.split(',').map(part => part.trim());
  const brandCity = brandParts[0] || '';
  const brandCountry = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';
  
  // Normalize country names
  const normalizeCountry = (country: string): string => {
    return country
      .replace(/\b(united states|usa|us|america|u\.s\.|u\.s\.a\.)\b/g, 'united states')
      .replace(/\b(united kingdom|uk|britain|england|great britain)\b/g, 'united kingdom')
      .replace(/\b(canada|ca)\b/g, 'canada')
      .trim();
  };
  
  const normalizedProfileCountry = normalizeCountry(profileCountry);
  const normalizedBrandCountry = normalizeCountry(brandCountry);
  
  // Same city = +15 boost
  if (profileCity && brandCity) {
    const normalizeCity = (city: string): string => {
      return city
        .replace(/\b(new york|nyc|ny)\b/g, 'new york')
        .replace(/\b(los angeles|la)\b/g, 'los angeles')
        .replace(/\b(san francisco|sf)\b/g, 'san francisco')
        .trim();
    };
    
    const normalizedProfileCity = normalizeCity(profileCity);
    const normalizedBrandCity = normalizeCity(brandCity);
    
    if (normalizedProfileCity === normalizedBrandCity) {
      return 15; // Significant boost for same city
    }
  }
  
  // Metropolitan area = +10 boost
  const metropolitanAreas = {
    'new york': ['new york', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'new york city'],
    'los angeles': ['los angeles', 'la', 'hollywood', 'beverly hills', 'santa monica', 'west hollywood', 'culver city', 'venice'],
    'san francisco': ['san francisco', 'sf', 'palo alto', 'mountain view', 'oakland', 'berkeley'],
    'boston': ['boston', 'cambridge', 'somerville', 'brookline'],
    'chicago': ['chicago', 'evanston', 'oak park'],
    'seattle': ['seattle', 'bellevue', 'redmond', 'kirkland']
  };
  
  for (const [metro, areas] of Object.entries(metropolitanAreas)) {
    const profileInMetro = areas.some(area => 
      profileCity.includes(area) || brandLocation.includes(area)
    );
    const brandInMetro = areas.some(area => brandLocation.includes(area));
    
    if (profileInMetro && brandInMetro) {
      return 10; // Good boost for same metro area
    }
  }
  
  // Same country = +5 boost
  if (normalizedProfileCountry && normalizedBrandCountry && 
      normalizedProfileCountry === normalizedBrandCountry) {
    return 5; // Small boost for same country
  }
  
  return 0; // No geographic boost
}

function isLocalBrand(brand: any, brandProfile: any): boolean {
  const brandLocation = (brand.location || '').toLowerCase().trim();
  const profileCountry = (brandProfile.country || '').toLowerCase().trim();
  const profileCity = (brandProfile.city_region || '').toLowerCase().trim();
  
  if (!brandLocation || (!profileCountry && !profileCity)) {
    return false;
  }
  
  // Parse brand location
  const brandParts = brandLocation.split(',').map(part => part.trim());
  const brandCity = brandParts[0] || '';
  const brandCountry = brandParts.length > 1 ? brandParts[brandParts.length - 1] : '';
  
  // Normalize country names
  const normalizeCountry = (country: string): string => {
    return country
      .replace(/\b(united states|usa|us|america|u\.s\.|u\.s\.a\.)\b/g, 'united states')
      .replace(/\b(united kingdom|uk|britain|england|great britain)\b/g, 'united kingdom')
      .replace(/\b(canada|ca)\b/g, 'canada')
      .trim();
  };
  
  const normalizedProfileCountry = normalizeCountry(profileCountry);
  const normalizedBrandCountry = normalizeCountry(brandCountry);
  
  // Check if same city or metro area
  if (profileCity && brandCity) {
    const normalizeCity = (city: string): string => {
      return city
        .replace(/\b(new york|nyc|ny)\b/g, 'new york')
        .replace(/\b(los angeles|la)\b/g, 'los angeles')
        .replace(/\b(san francisco|sf)\b/g, 'san francisco')
        .trim();
    };
    
    const normalizedProfileCity = normalizeCity(profileCity);
    const normalizedBrandCity = normalizeCity(brandCity);
    
    if (normalizedProfileCity === normalizedBrandCity) {
      return true; // Same city is local
    }
  }
  
  // Check metropolitan areas
  const metropolitanAreas = {
    'new york': ['new york', 'nyc', 'manhattan', 'brooklyn', 'queens', 'bronx', 'staten island', 'new york city'],
    'los angeles': ['los angeles', 'la', 'hollywood', 'beverly hills', 'santa monica', 'west hollywood', 'culver city', 'venice'],
    'san francisco': ['san francisco', 'sf', 'palo alto', 'mountain view', 'oakland', 'berkeley'],
    'boston': ['boston', 'cambridge', 'somerville', 'brookline'],
    'chicago': ['chicago', 'evanston', 'oak park'],
    'seattle': ['seattle', 'bellevue', 'redmond', 'kirkland']
  };
  
  for (const [metro, areas] of Object.entries(metropolitanAreas)) {
    const profileInMetro = areas.some(area => 
      profileCity.includes(area) || brandLocation.includes(area)
    );
    const brandInMetro = areas.some(area => brandLocation.includes(area));
    
    if (profileInMetro && brandInMetro) {
      return true; // Same metro area is local
    }
  }
  
  return false; // Not local
}