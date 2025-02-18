
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cleanJsonResponse(text: string): string {
  // First try to find JSON within markdown code blocks
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  
  // If no code blocks, try to find a JSON object directly
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }
  
  // If no JSON found, return cleaned text
  return text.replace(/```/g, '').trim();
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Received query:', query);
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided');
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service is not properly configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Create a recipe for: "${query}". Return a JSON object with this structure:
    {
      "title": "Recipe title",
      "description": "A brief description of the dish",
      "ingredients": ["List of ingredients with quantities"],
      "instructions": ["Step by step cooking instructions"]
    }

    Important rules:
    1. Format quantities clearly (e.g., "2 cups flour", "1 tablespoon olive oil")
    2. Make instructions detailed and numbered
    3. Return ONLY valid JSON - no markdown, no text before or after
    4. All fields must be present and properly formatted`;

    console.log('Sending prompt to Gemini');
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    console.log('Raw Gemini response:', rawText);

    const cleanedJson = cleanJsonResponse(rawText);
    console.log('Cleaned JSON:', cleanedJson);

    try {
      const recipeData = JSON.parse(cleanedJson);

      if (!recipeData.title || !recipeData.description || 
          !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions)) {
        throw new Error('Invalid recipe format');
      }

      return new Response(JSON.stringify(recipeData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('JSON parsing error:', error);
      throw new Error(`Invalid recipe format: ${error.message}`);
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
