
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cleanJsonResponse(text: string): string {
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }
  
  return text.replace(/```/g, '').trim();
}

serve(async (req) => {
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
      console.error('Missing GOOGLE_GEMINI_KEY environment variable');
      throw new Error('AI service configuration error: Missing API key');
    }

    console.log('Initializing Gemini with API key length:', apiKey.length);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    try {
      console.log('Sending prompt to Gemini...');
      const result = await model.generateContent([
        {
          text: `Create a recipe for: "${query}". Return a JSON object with this structure:
          {
            "title": "Recipe title",
            "description": "A brief description of the dish",
            "ingredients": ["List of ingredients with precise quantities"],
            "instructions": ["Step by step cooking instructions"],
            "prep_time": integer (estimated preparation time in minutes),
            "cook_time": integer (estimated cooking time in minutes),
            "estimated_calories": integer (estimated total calories for the entire recipe),
            "suggested_portions": integer (recommended number of portions based on the dish type),
            "portion_description": string (brief explanation of what a portion means, e.g., "slices for pizza", "pieces for cookies")
          }

          Important rules for portions:
          1. Analyze the dish type and suggest a realistic portion count:
             - Single-serve items (toast, sandwich): typically 1-2 portions
             - Family meals (casseroles, lasagna): typically 6-8 portions
             - Baked goods (cookies, muffins): typically 12-24 portions
             - Pizza: typically 6-8 slices
          2. The portion suggestion should match common serving sizes for this type of dish
          3. Include a clear description of what a portion means for this specific recipe

          Other important rules:
          1. Format quantities precisely (e.g., "2 cups flour", "1 tablespoon olive oil")
          2. Make instructions detailed and numbered
          3. Return ONLY valid JSON - no markdown, no text before or after
          4. All fields must be present and properly formatted
          5. Prep and cook times must be realistic estimates in minutes
          6. Calorie estimation should be based on standard ingredient calories
          7. If you're unsure about exact calories, provide a reasonable estimate based on similar recipes`
        }
      ]);

      console.log('Received response from Gemini');
      
      if (!result.response) {
        throw new Error('Empty response from Gemini');
      }

      const rawText = result.response.text();
      console.log('Raw response text length:', rawText.length);

      const cleanedJson = cleanJsonResponse(rawText);
      console.log('Cleaned JSON length:', cleanedJson.length);

      try {
        const recipeData = JSON.parse(cleanedJson);

        // Validate required fields
        const requiredFields = [
          'title', 'description', 'ingredients', 'instructions',
          'prep_time', 'cook_time', 'estimated_calories',
          'suggested_portions', 'portion_description'
        ];

        for (const field of requiredFields) {
          if (recipeData[field] === undefined) {
            throw new Error(`Missing required field: ${field}`);
          }
        }

        // Type validation
        if (!Array.isArray(recipeData.ingredients)) throw new Error('ingredients must be an array');
        if (!Array.isArray(recipeData.instructions)) throw new Error('instructions must be an array');
        if (typeof recipeData.prep_time !== 'number') throw new Error('prep_time must be a number');
        if (typeof recipeData.cook_time !== 'number') throw new Error('cook_time must be a number');
        if (typeof recipeData.estimated_calories !== 'number') throw new Error('estimated_calories must be a number');
        if (typeof recipeData.suggested_portions !== 'number') throw new Error('suggested_portions must be a number');
        if (typeof recipeData.portion_description !== 'string') throw new Error('portion_description must be a string');

        console.log('Validation passed, returning recipe data');

        return new Response(JSON.stringify(recipeData), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('Recipe data validation error:', error);
        throw new Error(`Invalid recipe format: ${error.message}`);
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      if (error.message?.includes('NOT_FOUND')) {
        throw new Error('Invalid API key or API service configuration');
      }
      throw error;
    }
  } catch (error) {
    console.error('Edge function error:', error);
    
    let status = 400;
    let errorMessage = error.message;

    // Specific error handling
    if (error.message?.includes('API key')) {
      status = 500;
      errorMessage = 'AI service configuration error. Please contact support.';
    } else if (error.message?.includes('Invalid recipe format')) {
      status = 400;
      errorMessage = 'Failed to generate a valid recipe. Please try again.';
    } else if (error.message?.includes('busy') || error.message?.includes('overloaded')) {
      status = 503;
      errorMessage = 'The AI service is temporarily busy. Please try again in a few moments.';
    }

    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
