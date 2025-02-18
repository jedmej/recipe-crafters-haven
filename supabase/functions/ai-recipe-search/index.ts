
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type Recipe = {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  servings: number;
};

function cleanJsonResponse(text: string): string {
  // Remove markdown code block formatting if present
  const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    return jsonMatch[1].trim();
  }
  return text.trim();
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

    const prompt = `Create a recipe based on this request: "${query}"
    You must return a JSON object (and nothing else) with exactly these fields:
    {
      "title": "Recipe title",
      "description": "Brief recipe description",
      "ingredients": ["list of ingredients with quantities"],
      "instructions": ["detailed step by step instructions"],
      "servings": 4
    }
    
    Rules:
    1. All ingredients must include specific quantities and units
    2. Instructions must be clear and step-by-step
    3. Return ONLY the JSON object with no additional text or formatting
    4. Do not include markdown code blocks or ```json formatting
    5. The response must be valid JSON that can be parsed`;

    console.log('Sending prompt to Gemini');
    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    console.log('Received raw response from Gemini:', rawText);

    // Clean up the response
    const text = cleanJsonResponse(rawText);
    console.log('Cleaned response:', text);
    
    try {
      const recipeData = JSON.parse(text);
      
      // Validate recipe data structure
      const requiredFields: (keyof Recipe)[] = ['title', 'description', 'ingredients', 'instructions', 'servings'];
      const missingFields = requiredFields.filter(field => !(field in recipeData));
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      if (!Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions)) {
        throw new Error('Ingredients and instructions must be arrays');
      }

      if (typeof recipeData.servings !== 'number') {
        recipeData.servings = 4; // Default to 4 servings if not a number
      }

      return new Response(JSON.stringify(recipeData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('JSON parsing/validation error:', error);
      throw new Error(`Failed to parse recipe data: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in ai-recipe-search function:', error);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
