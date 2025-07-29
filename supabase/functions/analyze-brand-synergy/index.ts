import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SynergyRequest {
  brandProfileId: string;
}

interface GptSynergyResponse {
  synergy_summary: string;
  collab_ideas: string[];
  pitch_line: string;
  match_score: number;
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

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { brandProfileId }: SynergyRequest = await req.json();

    if (!brandProfileId) {
      throw new Error('Brand profile ID is required');
    }

    console.log(`Starting GPT synergy analysis for brand profile: ${brandProfileId}`);

    // Get the brand profile
    const { data: brandProfile, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', brandProfileId)
      .single();

    if (brandError || !brandProfile) {
      throw new Error(`Failed to fetch brand profile: ${brandError?.message}`);
    }

    // Get Qloo analysis results for similar brands
    const { data: qlooData, error: qlooError } = await supabase
      .from('brand_qloo_analyses')
      .select('*')
      .eq('brand_profile_id', brandProfileId)
      .eq('status', 'completed')
      .single();

    if (qlooError || !qlooData) {
      throw new Error('No completed Qloo analysis found. Please run Qloo analysis first.');
    }

    // Update GPT analysis status to 'analyzing'
    await supabase
      .from('brand_profiles')
      .update({ gpt_synergy_status: 'analyzing' })
      .eq('id', brandProfileId);

    // Extract similar brands from Qloo data
    const similarBrands = qlooData.similar_brands || [];
    
    if (!Array.isArray(similarBrands) || similarBrands.length === 0) {
      throw new Error('No similar brands found in Qloo analysis');
    }

    console.log(`Found ${similarBrands.length} similar brands to analyze`);

    // Process each similar brand
    const synergyResults = [];

    for (const similarBrand of similarBrands) {
      try {
        // Create GPT prompt
        const gptPrompt = `You are a brand collaboration expert analyzing potential partnerships between brands based on cultural taste alignment and audience overlap.

Given:
- Brand A profile: 
  Name: ${brandProfile.brand_name}
  Industry: ${brandProfile.industry || 'Not specified'}
  Mission: ${brandProfile.mission_statement || 'Not specified'}
  Cultural Markers: ${brandProfile.cultural_taste_markers?.join(', ') || 'Not specified'}
  Audience Age Groups: ${brandProfile.audience_age_groups?.join(', ') || 'Not specified'}
  Audience Regions: ${brandProfile.audience_regions?.join(', ') || 'Not specified'}

- Brand B profile:
  Name: ${similarBrand.name}
  Category: ${similarBrand.category || 'Not specified'}
  
- Qloo overlap score: ${similarBrand.overlapScore}%

Provide analysis in the following JSON format only (no additional text):
{
  "synergy_summary": "50-75 word summary of why these brands would work well together",
  "collab_ideas": ["idea 1", "idea 2", "idea 3"],
  "pitch_line": "1-2 sentence compelling outreach message",
  "match_score": number between 0-100 representing overall partnership potential
}`;

        // Call OpenAI API
        const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: 'You are a brand collaboration expert. Always respond with valid JSON only.' 
              },
              { role: 'user', content: gptPrompt }
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        });

        if (!gptResponse.ok) {
          throw new Error(`OpenAI API error: ${gptResponse.statusText}`);
        }

        const gptData = await gptResponse.json();
        const gptContent = gptData.choices[0].message.content;

        // Parse GPT response
        let synergyAnalysis: GptSynergyResponse;
        try {
          synergyAnalysis = JSON.parse(gptContent);
        } catch (parseError) {
          console.error('Failed to parse GPT response:', gptContent);
          throw new Error('Invalid GPT response format');
        }

        // Validate required fields
        if (!synergyAnalysis.synergy_summary || !synergyAnalysis.collab_ideas || 
            !synergyAnalysis.pitch_line || typeof synergyAnalysis.match_score !== 'number') {
          throw new Error('Incomplete GPT analysis response');
        }

        // Store synergy analysis in database
        const { error: insertError } = await supabase
          .from('brand_synergy_analyses')
          .insert({
            brand_profile_id: brandProfileId,
            compared_brand_name: similarBrand.name,
            compared_brand_category: similarBrand.category,
            synergy_summary: synergyAnalysis.synergy_summary,
            collab_ideas: synergyAnalysis.collab_ideas,
            pitch_line: synergyAnalysis.pitch_line,
            match_score: Math.min(100, Math.max(0, Math.round(synergyAnalysis.match_score))),
            qloo_overlap_score: similarBrand.overlapScore,
            gpt_analysis_status: 'completed'
          });

        if (insertError) {
          console.error('Failed to insert synergy analysis:', insertError);
        } else {
          synergyResults.push({
            brand: similarBrand.name,
            match_score: synergyAnalysis.match_score
          });
        }

      } catch (error) {
        console.error(`Failed to analyze synergy for ${similarBrand.name}:`, error);
        
        // Store error record
        await supabase
          .from('brand_synergy_analyses')
          .insert({
            brand_profile_id: brandProfileId,
            compared_brand_name: similarBrand.name,
            compared_brand_category: similarBrand.category,
            gpt_analysis_status: 'failed',
            error_message: error.message,
            qloo_overlap_score: similarBrand.overlapScore
          });
      }
    }

    // Update brand profile with completion status
    await supabase
      .from('brand_profiles')
      .update({ 
        gpt_synergy_status: 'completed',
        last_gpt_sync: new Date().toISOString()
      })
      .eq('id', brandProfileId);

    console.log(`Completed GPT synergy analysis for ${synergyResults.length} brands`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Analyzed synergy for ${synergyResults.length} brands`,
        results: synergyResults
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in analyze-brand-synergy function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});