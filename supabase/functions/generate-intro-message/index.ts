import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

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
    const { targetBrand, currentBrandId } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current brand information
    const { data: currentBrand, error: brandError } = await supabase
      .from('brand_profiles')
      .select('*')
      .eq('id', currentBrandId)
      .single();

    if (brandError || !currentBrand) {
      throw new Error('Could not fetch current brand information');
    }

    // Generate intro message using OpenAI
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const prompt = `Generate a personalized and professional introduction message for a brand collaboration request. 

FROM BRAND:
- Name: ${currentBrand.brand_name}
- Industry: ${currentBrand.industry}
- Mission: ${currentBrand.mission_statement}
- Audience: ${currentBrand.audience_regions?.join(', ') || 'Not specified'}
- Interests: ${currentBrand.collaboration_interests?.join(', ') || 'General collaboration'}

TO BRAND:
- Name: ${targetBrand.brand_name}
- Industry: ${targetBrand.industry}
- Mission: ${targetBrand.mission_statement}

Requirements:
1. Keep it professional but friendly (150-200 words)
2. Mention specific synergies between the brands
3. Be genuine and avoid overly sales-y language
4. Include a clear call to action
5. Show that you've researched their brand
6. Suggest specific collaboration types that make sense

Write the message in first person from ${currentBrand.brand_name}'s perspective.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at writing professional business introduction messages for brand collaborations. Write engaging, personalized messages that highlight genuine synergies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('OpenAI API error:', data);
      throw new Error('Failed to generate intro message');
    }

    const generatedMessage = data.choices[0].message.content;

    return new Response(JSON.stringify({ 
      message: generatedMessage,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-intro-message function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      success: false 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});