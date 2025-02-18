
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided');
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service is not properly configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `Create a recipe based on this request: "${query}"
    Return ONLY a valid JSON object with these exact fields:
    {
      "title": "Recipe title",
      "description": "Brief recipe description",
      "ingredients": ["list of ingredients"],
      "instructions": ["step by step instructions"],
      "servings": 1
    }
    
    Make sure all ingredients have quantities and units where applicable.
    Make instructions clear and detailed.
    Respond with ONLY the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const recipeData = JSON.parse(text);
      
      // Validate recipe data
      if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
        throw new Error('Invalid recipe data structure');
      }

      return new Response(JSON.stringify(recipeData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error('Failed to parse recipe data');
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
