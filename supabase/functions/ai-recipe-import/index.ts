
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url) {
      throw new Error('No URL provided');
    }

    // Fetch the webpage content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch recipe page');
    }
    const html = await response.text();

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service is not properly configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Extract recipe information from this HTML content and return it as a JSON object. The webpage content is:

    ${html}

    Return a JSON object with this exact structure:
    {
      "title": "Recipe title",
      "description": "Brief description of the dish",
      "ingredients": ["List of ingredients with quantities"],
      "instructions": ["Numbered list of cooking steps"],
      "prep_time": integer (in minutes),
      "cook_time": integer (in minutes),
      "estimated_calories": integer (estimated total calories),
      "suggested_portions": integer (recommended number of portions),
      "portion_description": string (what a portion means, e.g., "slices" for pizza)
    }

    Important guidelines for portions:
    1. Analyze the dish type and suggest a realistic portion count:
       - Single-serve items (toast, sandwich): typically 1-2 portions
       - Family meals (casseroles, lasagna): typically 6-8 portions
       - Baked goods (cookies, muffins): typically 12-24 portions
       - Pizza: typically 6-8 slices
    2. Include a clear description of what a "portion" means
    3. Base the suggestion on common serving sizes for this type of dish

    Additional rules:
    1. Extract all measurements and quantities precisely
    2. Return ONLY the JSON object, no other text
    3. All number fields should be integers
    4. If any information is missing, use reasonable estimates based on similar recipes
    5. Clean up any formatting issues in the text`;

    const result = await model.generateContent(prompt);
    const resultText = result.response.text();

    // Extract JSON from the response
    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract recipe data');
    }

    const recipeData = JSON.parse(jsonMatch[0]);

    return new Response(
      JSON.stringify(recipeData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
