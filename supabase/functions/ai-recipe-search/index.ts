
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function generateRecipe(query: string, retryCount = 0): Promise<any> {
  const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
  if (!apiKey) {
    throw new Error('Recipe search service is not properly configured');
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Generate a recipe based on this request: "${query}"
    Return ONLY a valid JSON object with these exact fields:
    {
      "title": "Recipe title",
      "description": "Brief recipe description",
      "ingredients": ["list of ingredients with measurements"],
      "instructions": ["step by step instructions"]
    }
    Make sure the response is valid JSON. No other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      return JSON.parse(text);
    } catch (error) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid recipe format received');
      }
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error(`Attempt ${retryCount + 1} failed:`, error);
    
    if (error.message.includes('503') && retryCount < MAX_RETRIES) {
      console.log(`Retrying after ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return generateRecipe(query, retryCount + 1);
    }
    
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Invalid query provided' }), 
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const recipeData = await generateRecipe(query);

    if (!recipeData || !recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
      throw new Error('Invalid recipe data structure');
    }

    return new Response(
      JSON.stringify(recipeData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error generating recipe:', error);
    
    let status = 500;
    let message = 'Failed to generate recipe. Please try again.';
    
    if (error.message.includes('503')) {
      status = 503;
      message = 'Service is currently busy. Please try again in a few moments.';
    } else if (error.message.includes('configuration')) {
      status = 500;
      message = 'Recipe service is not properly configured.';
    }

    return new Response(
      JSON.stringify({ error: message }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
