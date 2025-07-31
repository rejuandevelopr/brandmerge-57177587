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
      throw new Error('Missing required API keys');
    }

    const { industry = '', limit = 10 } = await req.json();

    // Define search queries for partnership news
    const searchQueries = [
      `"brand partnership" "collaboration announcement" ${industry} 2025`,
      `"strategic partnership" "brand collaboration" ${industry}`,
      `"joint venture" "co-marketing" ${industry} brands`,
      `"partnership success story" ${industry} collaboration`
    ];

    const allPartnerships = [];

    // Execute search queries
    for (const query of searchQueries) {
      console.log(`Searching for partnerships: ${query}`);
      
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${searchEngineId}&q=${encodeURIComponent(query)}&num=10&dateRestrict=m6`; // Last 6 months
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();

      if (searchData.items) {
        // Process search results with OpenAI
        for (const item of searchData.items.slice(0, 3)) {
          try {
            const aiPrompt = `
            Analyze this search result about a brand partnership/collaboration:
            Title: ${item.title}
            Snippet: ${item.snippet}
            URL: ${item.link}

            Extract and return JSON with:
            {
              "brand_1": "first brand name",
              "brand_2": "second brand name", 
              "collaboration_type": "type of partnership (co-marketing, product collaboration, etc.)",
              "industry_tags": ["relevant industry tags"],
              "success_indicators": ["metrics or success signals mentioned"],
              "summary": "brief summary of the partnership",
              "relevance_score": number from 0-100 based on how strategic/notable this partnership is
            }

            Only return the JSON object. If this doesn't appear to be about a real brand partnership, return null.
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
                  { role: 'system', content: 'You are a partnership intelligence analyst. Extract structured data about brand collaborations from news and announcements.' },
                  { role: 'user', content: aiPrompt }
                ],
                temperature: 0.3,
              }),
            });

            const aiData = await aiResponse.json();
            const extractedData = JSON.parse(aiData.choices[0].message.content);

            if (extractedData && extractedData.brand_1 && extractedData.brand_2) {
              allPartnerships.push({
                ...extractedData,
                source_url: item.link,
                announcement_date: new Date().toISOString(), // Placeholder - could be enhanced to extract actual dates
              });
            }
          } catch (error) {
            console.error('Error processing partnership result:', error);
          }
        }
      }

      // Log the search operation
      await supabase.from('data_refresh_log').insert({
        source_type: 'google_search_partnerships',
        search_query: query,
        results_count: searchData.items?.length || 0,
        status: searchData.items ? 'success' : 'no_results'
      });
    }

    // Deduplicate partnerships
    const uniquePartnerships = allPartnerships.filter((partnership, index, arr) => 
      arr.findIndex(p => 
        (p.brand_1.toLowerCase() === partnership.brand_1.toLowerCase() && 
         p.brand_2.toLowerCase() === partnership.brand_2.toLowerCase()) ||
        (p.brand_1.toLowerCase() === partnership.brand_2.toLowerCase() && 
         p.brand_2.toLowerCase() === partnership.brand_1.toLowerCase())
      ) === index
    );

    // Store in database
    if (uniquePartnerships.length > 0) {
      const { error: insertError } = await supabase
        .from('partnership_news')
        .insert(uniquePartnerships.slice(0, limit));

      if (insertError) {
        console.error('Error inserting partnerships:', insertError);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      discovered: uniquePartnerships.length,
      partnerships: uniquePartnerships 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fetch-partnership-news:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});