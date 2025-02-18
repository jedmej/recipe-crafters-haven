
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchWebContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch webpage');
  return response.text();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    console.log('Processing URL:', url);
    const content = await fetchWebContent(url);
    console.log('Fetched content length:', content.length);

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service is not properly configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are a recipe extraction expert. Analyze this webpage content and extract a complete recipe.

Format your response as ONLY a valid JSON object with these exact fields and nothing else:
{
  "title": "Recipe title here",
  "description": "Brief description here",
  "ingredients": [
    "ingredient 1 with quantity",
    "ingredient 2 with quantity"
  ],
  "instructions": [
    "step 1",
    "step 2"
  ],
  "servings": number_of_servings
}

Rules:
- Return ONLY the JSON object, no other text
- Ingredients MUST be an array of strings with quantities
- Instructions MUST be an array of strings
- Servings MUST be a number
- Each ingredient must include its quantity
- Each instruction must be clear and detailed

Webpage content to analyze:
${content.slice(0, 10000)}`;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Raw Gemini response:', text);
    
    try {
      // Try to clean the response if it contains additional text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      console.log('Cleaned JSON text:', jsonText);
      
      const recipeData = JSON.parse(jsonText);
      
      // Enhanced validation
      if (!recipeData.title || typeof recipeData.title !== 'string') {
        throw new Error('Invalid or missing title');
      }
      if (!Array.isArray(recipeData.ingredients) || recipeData.ingredients.length === 0) {
        throw new Error('Invalid or empty ingredients array');
      }
      if (!Array.isArray(recipeData.instructions) || recipeData.instructions.length === 0) {
        throw new Error('Invalid or empty instructions array');
      }
      if (typeof recipeData.servings !== 'number' || recipeData.servings < 1) {
        recipeData.servings = 1; // Default to 1 if invalid
      }
      if (!recipeData.description) {
        recipeData.description = ''; // Empty string if missing
      }

      console.log('Successfully parsed recipe:', JSON.stringify(recipeData, null, 2));
      return new Response(JSON.stringify(recipeData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Recipe parsing error:', error);
      console.error('Attempted to parse:', text);
      throw new Error(`Failed to extract recipe: ${error.message}. Please check if the URL contains a valid recipe.`);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
