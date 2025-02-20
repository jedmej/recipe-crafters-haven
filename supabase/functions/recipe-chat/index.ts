import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecipeData {
  title: string;
  description: string;
  ingredients: string[];
  instructions: string[];
  prep_time: number;
  cook_time: number;
  estimated_calories: number;
  suggested_portions: number;
  portion_description: string;
}

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'pl': 'Polish',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, language = 'en' } = await req.json();
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided');
    }

    if (!SUPPORTED_LANGUAGES[language]) {
      throw new Error('Unsupported language');
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service configuration error: Missing API key');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      },
    });

    const prompt = `You are a helpful cooking assistant. Please create a recipe in ${SUPPORTED_LANGUAGES[language]} language based on the user's request: "${query}"

    Return ONLY a JSON object with this exact structure, and no other text:
    {
      "title": "Recipe title in ${SUPPORTED_LANGUAGES[language]}",
      "description": "Brief description in ${SUPPORTED_LANGUAGES[language]}",
      "ingredients": ["List of ingredients with quantities in ${SUPPORTED_LANGUAGES[language]}"],
      "instructions": ["Step by step instructions in ${SUPPORTED_LANGUAGES[language]}"],
      "prep_time": number (in minutes),
      "cook_time": number (in minutes),
      "estimated_calories": number (per serving),
      "suggested_portions": number,
      "portion_description": "Portion size description in ${SUPPORTED_LANGUAGES[language]}"
    }

    Ensure all text fields are descriptive and clear, written in ${SUPPORTED_LANGUAGES[language]}. All numbers must be integers.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const recipeData = JSON.parse(jsonMatch[0]) as RecipeData;

      // Validate the recipe data
      const requiredFields: (keyof RecipeData)[] = [
        'title', 'description', 'ingredients', 'instructions',
        'prep_time', 'cook_time', 'estimated_calories',
        'suggested_portions', 'portion_description'
      ];

      for (const field of requiredFields) {
        if (!recipeData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate data types
      if (!Array.isArray(recipeData.ingredients)) throw new Error('ingredients must be an array');
      if (!Array.isArray(recipeData.instructions)) throw new Error('instructions must be an array');
      if (typeof recipeData.prep_time !== 'number') throw new Error('prep_time must be a number');
      if (typeof recipeData.cook_time !== 'number') throw new Error('cook_time must be a number');
      if (typeof recipeData.estimated_calories !== 'number') throw new Error('estimated_calories must be a number');
      if (typeof recipeData.suggested_portions !== 'number') throw new Error('suggested_portions must be a number');

      return new Response(
        JSON.stringify({
          success: true,
          data: recipeData,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Failed to process recipe data:', error);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to process recipe: ${error.message}`,
          raw_response: text
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 