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

    // Get OpenAI API key
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openaiApiKey) {
      throw new Error('Missing OPENAI_API_KEY');
    }

    const { searchType = 'partnerships', industry = '', limit = 10, country = '', city = '' } = await req.json();

    let searchResults = [];
    let searchQueries = [];

    if (searchType === 'partnerships') {
      searchResults = await searchPartnershipsChatGPT(openaiApiKey, industry, limit);
      searchQueries = [`ChatGPT search: brand partnerships ${industry}`];
    } else if (searchType === 'startups') {
      searchResults = await searchStartupsChatGPT(openaiApiKey, industry, country, city, limit);
      searchQueries = [`ChatGPT search: trending startups ${industry} ${country} ${city}`];
    } else if (searchType === 'brand-matches') {
      const { brandName, brandIndustry, brandLocation } = await req.json();
      searchResults = await searchBrandMatchesChatGPT(openaiApiKey, brandName, brandIndustry, brandLocation, limit);
      searchQueries = [`ChatGPT search: brand matches for ${brandName}`];
    }

    // Log the search operation for comparison
    await supabase.from('data_refresh_log').insert({
      source_type: `chatgpt_search_${searchType}`,
      search_query: searchQueries[0],
      results_count: searchResults.length,
      status: searchResults.length > 0 ? 'success' : 'no_results'
    });

    return new Response(JSON.stringify({ 
      success: true, 
      searchType,
      discovered: searchResults.length,
      results: searchResults,
      method: 'ChatGPT Search API'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in test-chatgpt-search:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function searchPartnershipsChatGPT(openaiApiKey: string, industry: string, limit: number) {
  const searchPrompt = `
Search the web for recent brand partnerships and collaborations from 2024-2025. Focus on ${industry ? `the ${industry} industry` : 'all industries'}.

Find partnerships that include:
- Brand collaborations and co-marketing campaigns  
- Strategic partnerships between companies
- Joint ventures and product collaborations
- Successful partnership announcements

For each partnership found, return JSON with this exact structure:
{
  "brand_1": "First brand name",
  "brand_2": "Second brand name", 
  "collaboration_type": "Type of partnership",
  "industry_tags": ["industry", "tags"],
  "success_indicators": ["metrics or success signals"],
  "summary": "Brief summary of the partnership",
  "relevance_score": number from 0-100,
  "source_url": "Source URL or website reference",
  "announcement_date": "2024-XX-XX or recent date"
}

Return an array of ${limit} most relevant and recent partnerships. Only include real, verified partnerships with credible sources.
`;

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
            content: 'You are a business intelligence researcher with web search capabilities. Search the web for current, factual information about brand partnerships and return structured JSON data.' 
          },
          { role: 'user', content: searchPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        // Extract JSON array from the response
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        
        // Fallback: try to parse the entire content
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse ChatGPT partnerships response:', parseError);
        console.error('Response content:', content);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('ChatGPT partnerships search error:', error);
    return [];
  }
}

async function searchStartupsChatGPT(openaiApiKey: string, industry: string, country: string, city: string, limit: number) {
  const location = [city, country].filter(Boolean).join(', ');
  const searchPrompt = `
Search the web for trending startups and emerging companies in 2024-2025. Focus on:
${industry ? `- Industry: ${industry}` : '- All industries'}
${location ? `- Location: ${location}` : '- Global startups'}

Find startups that are:
- Recently founded or gaining significant traction
- Seeking partnerships or collaborations
- Showing growth indicators (funding, expansion, media coverage)
- Open to brand partnerships

For each startup found, return JSON with this exact structure:
{
  "company_name": "Company name",
  "industry": "Industry category",
  "description": "Brief description of what they do",
  "growth_indicators": ["list of growth signals"],
  "partnership_signals": ["indicators they're open to partnerships"],
  "cultural_markers": ["lifestyle/culture indicators"],
  "funding_status": "Funding stage or unknown",
  "country": "Country",
  "city": "City",
  "headquarters_location": "Full location",
  "source_url": "Source URL or website",
  "opportunity_score": number from 0-100
}

Return an array of ${limit} most promising startups with partnership potential. Only include real companies with verifiable information.
`;

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
            content: 'You are a startup intelligence researcher with web search capabilities. Search the web for current information about trending startups and return structured JSON data.' 
          },
          { role: 'user', content: searchPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse ChatGPT startups response:', parseError);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('ChatGPT startups search error:', error);
    return [];
  }
}

async function searchBrandMatchesChatGPT(openaiApiKey: string, brandName: string, brandIndustry: string, brandLocation: string, limit: number) {
  const searchPrompt = `
Search the web for companies and brands that could be potential partners for "${brandName}", a ${brandIndustry} company based in ${brandLocation}.

Find brands that would be good partnership matches based on:
- Similar industry or complementary industries
- Geographic proximity or market overlap
- Cultural alignment and brand values
- Partnership history and collaboration openness
- Business model compatibility

For each potential partner found, return JSON with this exact structure:
{
  "name": "Company name",
  "industry": "Industry category", 
  "location": "City, Country",
  "website": "Website URL",
  "description": "What they do and why they're a good match",
  "matchType": "industry_similar|location_based|cultural_alignment|partnership_opportunity",
  "overlapScore": number from 0.3-1.0,
  "source_url": "Source URL where found"
}

Return an array of ${limit} best potential brand partners. Only include real companies with verifiable business information.
`;

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
            content: 'You are a business partnership researcher with web search capabilities. Search the web for potential brand partners and return structured JSON data.' 
          },
          { role: 'user', content: searchPrompt }
        ],
        temperature: 0.3,
        max_tokens: 3000,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (content) {
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(content);
      } catch (parseError) {
        console.error('Failed to parse ChatGPT brand matches response:', parseError);
        return [];
      }
    }
    
    return [];
  } catch (error) {
    console.error('ChatGPT brand matches search error:', error);
    return [];
  }
}