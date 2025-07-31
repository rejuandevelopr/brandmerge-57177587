import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BrandMatchRequest {
  brandProfileId: string;
}

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
}

interface ExtractedBrand {
  name: string;
  industry: string;
  location: string;
  website: string;
  description: string;
  matchType: string;
  overlapScore: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const googleSearchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!googleApiKey || !googleSearchEngineId || !openaiApiKey) {
      throw new Error('Missing required API keys');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { brandProfileId } = await req.json() as BrandMatchRequest;

    console.log(`Starting brand match analysis for brand profile: ${brandProfileId}`);

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

    // Generate search queries based on brand profile
    const searchQueries = generateSearchQueries(brandProfile);
    const allMatchedBrands: ExtractedBrand[] = [];

    // Perform Google searches
    for (const query of searchQueries) {
      console.log(`Searching for: ${query}`);
      
      const searchResults = await performGoogleSearch(query, googleApiKey, googleSearchEngineId);
      const extractedBrands = await extractBrandsFromResults(searchResults, brandProfile, openaiApiKey);
      
      allMatchedBrands.push(...extractedBrands);
    }

    // Remove duplicates and filter by quality
    const uniqueBrands = removeDuplicateBrands(allMatchedBrands);
    const filteredBrands = uniqueBrands
      .filter(brand => brand.overlapScore >= 0.3)
      .sort((a, b) => b.overlapScore - a.overlapScore)
      .slice(0, 20);

    // Store results in database
    const { error: insertError } = await supabase
      .from('brand_match_analyses')
      .insert({
        brand_profile_id: brandProfileId,
        search_query: searchQueries.join('; '),
        matched_brands: filteredBrands,
        analysis_status: 'completed',
        match_count: filteredBrands.length,
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

    console.log(`Successfully analyzed ${filteredBrands.length} brand matches`);

    return new Response(JSON.stringify({
      success: true,
      matchCount: filteredBrands.length,
      brands: filteredBrands.slice(0, 5), // Return top 5 for immediate display
      sessionId: session.id
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-brand-matches function:', error);
    
    return new Response(JSON.stringify({
      error: error.message,
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateSearchQueries(brandProfile: any): string[] {
  const queries = [];
  const industry = brandProfile.industry || '';
  const location = brandProfile.country || brandProfile.city_region || '';
  const culturalMarkers = brandProfile.cultural_taste_markers || [];
  
  // Industry-based searches
  if (industry && location) {
    queries.push(`"${industry}" companies ${location} partnership collaboration`);
    queries.push(`${industry} brands ${location} similar companies`);
  }
  
  // Cultural alignment searches
  if (culturalMarkers.length > 0) {
    const markers = culturalMarkers.slice(0, 3).join(' ');
    queries.push(`brands ${markers} ${location} partnership`);
  }
  
  // Generic partnership searches
  if (location) {
    queries.push(`startup companies ${location} brand partnerships`);
    queries.push(`business collaboration opportunities ${location}`);
  }
  
  return queries.slice(0, 4); // Limit to 4 searches to avoid rate limits
}

async function performGoogleSearch(query: string, apiKey: string, searchEngineId: string): Promise<GoogleSearchResult[]> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.items) {
      return data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        snippet: item.snippet || ''
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Google search failed for query "${query}":`, error);
    return [];
  }
}

async function extractBrandsFromResults(
  searchResults: GoogleSearchResult[],
  brandProfile: any,
  openaiApiKey: string
): Promise<ExtractedBrand[]> {
  if (searchResults.length === 0) return [];
  
  const prompt = `
Analyze these search results and extract potential brand partnership opportunities for "${brandProfile.brand_name}" (${brandProfile.industry}, ${brandProfile.country || brandProfile.city_region}).

Target brand details:
- Industry: ${brandProfile.industry}
- Mission: ${brandProfile.mission_statement}
- Location: ${brandProfile.country || brandProfile.city_region}
- Cultural markers: ${brandProfile.cultural_taste_markers?.join(', ') || 'N/A'}

Search Results:
${searchResults.map(result => `Title: ${result.title}\nURL: ${result.link}\nDescription: ${result.snippet}`).join('\n\n')}

Extract up to 8 potential brand partners from these results. For each brand, provide:
1. Company/brand name
2. Industry sector
3. Location (city, country)
4. Website URL (if available)
5. Brief description (1-2 sentences)
6. Match type (industry_similar, location_based, cultural_alignment, or partnership_opportunity)
7. Overlap score (0.0-1.0 based on compatibility)

Return ONLY a valid JSON array with this structure:
[
  {
    "name": "Brand Name",
    "industry": "Industry",
    "location": "City, Country",
    "website": "https://...",
    "description": "Brief description",
    "matchType": "industry_similar",
    "overlapScore": 0.75
  }
]

Focus on real companies that could realistically partner with ${brandProfile.brand_name}. Exclude generic results, news articles, or non-business entities.
`;

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
          { role: 'system', content: 'You are an expert business analyst specializing in identifying strategic partnerships and brand collaborations.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        const extractedBrands = JSON.parse(content);
        return Array.isArray(extractedBrands) ? extractedBrands : [];
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('OpenAI API error:', error);
    return [];
  }
}

function removeDuplicateBrands(brands: ExtractedBrand[]): ExtractedBrand[] {
  const seen = new Set();
  return brands.filter(brand => {
    const key = brand.name.toLowerCase().trim();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}