import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandDiscoveryRequest {
  brandProfileId: string;
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
    const { brandProfileId } = await req.json() as BrandDiscoveryRequest;

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
    const discoveredBrands = await discoverBrandsWithChatGPT(brandProfile, openaiApiKey);

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
        industry_filter: brandProfile.industry
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

async function discoverBrandsWithChatGPT(brandProfile: any, openaiApiKey: string): Promise<DiscoveredBrand[]> {
  const culturalMarkers = brandProfile.cultural_taste_markers?.join(', ') || '';
  const collaborationInterests = brandProfile.collaboration_interests?.join(', ') || '';
  const location = brandProfile.country || brandProfile.city_region || '';

  const prompt = `
You are an expert brand partnership analyst. Find 10-15 real brands that would align culturally and audience-wise with the target brand described below.

TARGET BRAND: "${brandProfile.brand_name}"
Industry: ${brandProfile.industry}
Location: ${location}
Mission: ${brandProfile.mission_statement}
Cultural Taste Markers: ${culturalMarkers}
Collaboration Interests: ${collaborationInterests}

TASK: Search the web and find 10-15 REAL brands that:
1. Share similar cultural values or aesthetic
2. Target similar audiences but aren't direct competitors
3. Would be good candidates for partnerships, collaborations, or cross-promotion
4. Have complementary rather than competing offerings

SEARCH CRITERIA:
- Look for brands with similar cultural positioning
- Consider audience overlap potential
- Focus on partnership-friendly companies
- Include both established and emerging brands
- Prioritize brands open to collaborations

REQUIRED OUTPUT: Return a valid JSON array with exactly this structure:
[
  {
    "name": "Exact Brand Name",
    "industry": "Specific Industry",
    "location": "City, Country (if known)",
    "culturalTasteMarkers": ["marker1", "marker2", "marker3"],
    "collaborationInterests": ["partnership type1", "partnership type2"],
    "website": "https://website.com (if found)",
    "description": "Brief description of what they do and why they align",
    "matchScore": 85,
    "sourceUrl": "Source where you found this info (if applicable)",
    "culturalAlignScore": 85,
    "collaborationPossibility": "High",
    "collaborationDescription": "Recently funded Series A, actively seeking brand partnerships"
  }
]

IMPORTANT RULES:
- Only include REAL, existing brands you can find information about
- Match score should be 40-95 based on alignment strength
- Cultural taste markers should be relevant to the brand's positioning
- Collaboration interests should be realistic based on their business model
- Descriptions should explain WHY they're a good match
- Prioritize quality matches over quantity

Find brands that ${brandProfile.brand_name} would genuinely want to partner with.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { 
            role: 'system', 
            content: 'You are a brand partnership expert with access to current web search. Always search for real brands and return valid JSON arrays only. Make sure all brands you suggest actually exist and are active businesses.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        // Clean the response to ensure it's valid JSON
        const cleanContent = content.trim();
        const jsonMatch = cleanContent.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanContent;
        
        const discoveredBrands = JSON.parse(jsonString);
        console.log(`ChatGPT discovered ${discoveredBrands.length} aligned brands`);
        
        // Validate and filter the results
        const validBrands = discoveredBrands.filter((brand: any) => 
          brand.name && 
          brand.industry && 
          brand.description && 
          typeof brand.matchScore === 'number' &&
          brand.matchScore >= 40
        ).map((brand: any) => ({
          ...brand,
          culturalAlignScore: brand.culturalAlignScore || brand.matchScore,
          collaborationPossibility: brand.collaborationPossibility || determineCollaborationLevel(brand),
          collaborationDescription: brand.collaborationDescription || generateCollaborationDescription(brand)
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
  // Determine match type based on brand characteristics
  if (brand.industry === brandProfile.industry) {
    return 'industry_similar';
  }
  
  if (brand.location === (brandProfile.country || brandProfile.city_region)) {
    return 'location_based';
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