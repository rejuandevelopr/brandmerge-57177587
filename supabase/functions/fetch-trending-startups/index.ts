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
    const googleApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
    const searchEngineId = Deno.env.get('GOOGLE_SEARCH_ENGINE_ID');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!googleApiKey || !searchEngineId || !openaiApiKey) {
      throw new Error('Missing required API keys: GOOGLE_SEARCH_API_KEY, GOOGLE_SEARCH_ENGINE_ID, or OPENAI_API_KEY');
    }

    const { industry = 'technology', limit = 10 } = await req.json();

    // Define search queries for trending startups
    const searchQueries = [
      `"fastest growing startups 2025" ${industry}`,
      `"new ${industry} brands seeking partnerships"`,
      `"${industry} startups Series A funding 2025"`,
      `"trending ${industry} companies collaboration opportunities"`
    ];

    const allStartups = [];

    // Execute search queries
    for (const query of searchQueries) {
      console.log(`Searching for: ${query}`);
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.items) {
        // Process search results with OpenAI
        for (const item of searchData.items.slice(0, 3)) { // Limit to top 3 per query
          try {
            const aiPrompt = `
            Analyze this search result and extract startup information:
            Title: ${item.title}
            Snippet: ${item.snippet}
            URL: ${item.link}

            Extract and return JSON with:
            {
              "company_name": "extracted company name or null if not a startup",
              "industry": "industry category",
              "description": "brief description",
              "growth_indicators": ["list of growth signals mentioned"],
              "partnership_signals": ["indicators they're open to partnerships"],
              "cultural_markers": ["lifestyle/culture indicators"],
              "funding_status": "funding stage mentioned or unknown"
            }

            Only return the JSON object. If this doesn't appear to be about a startup, return null.
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
                  { role: 'system', content: 'You are a startup intelligence analyst. Extract structured data about startups from web search results.' },
                  { role: 'user', content: aiPrompt }
                ],
                temperature: 0.3,
              }),
            });

            const aiData = await aiResponse.json();
            const extractedData = JSON.parse(aiData.choices[0].message.content);

            if (extractedData && extractedData.company_name) {
              allStartups.push({
                ...extractedData,
                source_url: item.link,
                search_query: query,
                opportunity_score: Math.random() * 100, // Placeholder - will be enhanced
              });
            }
          } catch (error) {
            console.error('Error processing search result:', error);
          }
        }
      }

      // Log the search operation
      await supabase.from('data_refresh_log').insert({
        source_type: 'google_search_startups',
        search_query: query,
        results_count: searchData.items?.length || 0,
        status: searchData.items ? 'success' : 'no_results'
      });
    }

    // Deduplicate by company name
    const uniqueStartups = allStartups.filter((startup, index, arr) => 
      arr.findIndex(s => s.company_name.toLowerCase() === startup.company_name.toLowerCase()) === index
    );

    // Store in database
    const startupInserts = uniqueStartups.slice(0, limit).map(startup => ({
      company_name: startup.company_name,
      industry: startup.industry,
      description: startup.description,
      growth_indicators: startup.growth_indicators,
      partnership_signals: startup.partnership_signals,
      cultural_markers: startup.cultural_markers,
      funding_status: startup.funding_status,
      source_url: startup.source_url,
      opportunity_score: startup.opportunity_score,
    }));

    if (startupInserts.length > 0) {
      const { error: insertError } = await supabase
        .from('trending_startups')
        .upsert(startupInserts, { 
          onConflict: 'company_name',
          ignoreDuplicates: false 
        });

      if (insertError) {
        console.error('Error inserting startups:', insertError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      discovered: uniqueStartups.length,
      stored: startupInserts.length,
      startups: uniqueStartups 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-trending-startups:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});