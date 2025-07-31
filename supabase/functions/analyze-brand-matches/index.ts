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
You are an expert business analyst. Extract potential brand partnership opportunities from these search results.

Target Brand: "${brandProfile.brand_name}"
Industry: ${brandProfile.industry}
Location: ${brandProfile.country || brandProfile.city_region}

Search Results:
${searchResults.map((result, index) => `${index + 1}. ${result.title}\n   ${result.snippet}\n   URL: ${result.link}`).join('\n\n')}

TASK: Find REAL companies/brands mentioned in these search results that could partner with ${brandProfile.brand_name}.

RULES:
- Only extract actual company/brand names mentioned in the search results
- Look for companies in partnerships, collaborations, funding announcements, or business listings
- Ignore news sites, blogs, directories, or generic results
- Each brand must be a real business entity

REQUIRED OUTPUT: Valid JSON array with exactly this structure:
[
  {
    "name": "Exact Company Name",
    "industry": "Specific Industry",
    "location": "City, Country",
    "website": "URL from results or inferred",
    "description": "What they do (from search results)",
    "matchType": "industry_similar",
    "overlapScore": 0.75
  }
]

Match Types: "industry_similar", "location_based", "cultural_alignment", "partnership_opportunity"
Overlap Score: 0.3-1.0 based on relevance to ${brandProfile.brand_name}

Return maximum 6 brands. If no real brands found, return empty array [].`;

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
          { role: 'system', content: 'You extract company information from search results. Always return valid JSON arrays only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000,
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
        
        const extractedBrands = JSON.parse(jsonString);
        console.log(`Extracted ${extractedBrands.length} brands from search results`);
        return Array.isArray(extractedBrands) ? extractedBrands : [];
      } catch (parseError) {
        console.error('Failed to parse OpenAI response as JSON:', parseError);
        console.error('Response content:', content);
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