import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function cleanHtml(html: string): string {
  // Remove script and style tags and their content
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Remove HTML tags but keep their content
  html = html.replace(/<[^>]*>/g, ' ');
  
  // Remove extra whitespace
  html = html.replace(/\s+/g, ' ').trim();
  
  // Truncate to approximately 15k characters (roughly half the token limit)
  // This ensures we have room for the prompt and response
  return html.slice(0, 15000);
}

function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pl': 'Polish'
  };
  return languages[code] || 'English';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, targetLanguage = 'en' } = await req.json();
    console.log('Importing recipe from URL:', url);
    console.log('Target language:', targetLanguage);

    if (!url) {
      throw new Error('No URL provided');
    }

    // Fetch webpage content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch recipe page');
    }

    const html = await response.text();
    const cleanedContent = cleanHtml(html);
    console.log('Cleaned content length:', cleanedContent.length);

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service is not properly configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const languageName = getLanguageName(targetLanguage);
    const prompt = `Extract recipe information from this webpage content and translate it into ${languageName}. Return the result as a JSON object. The webpage content is:

    ${cleanedContent}

    Return a JSON object with this exact structure, with ALL text in ${languageName}:
    {
      "title": "Recipe title in ${languageName}",
      "description": "Brief description of the dish in ${languageName}",
      "ingredients": ["List of ingredients with quantities in ${languageName}"],
      "instructions": ["Numbered list of cooking steps in ${languageName}"],
      "prep_time": integer (in minutes),
      "cook_time": integer (in minutes),
      "estimated_calories": integer (estimated total calories),
      "suggested_portions": integer (recommended number of portions),
      "portion_description": string (what a portion means in ${languageName}, e.g., "slices" for pizza),
      "categories": {
        "meal_type": "One of: breakfast, lunch, dinner, snack, dessert",
        "dietary_restrictions": "One of: vegetarian, vegan, gluten-free, low-carb, dairy-free, none",
        "difficulty_level": "One of: easy, intermediate, advanced",
        "cuisine_type": "One of: Italian, Mexican, Asian, Mediterranean, French, American, Indian, etc.",
        "cooking_method": "One of: baked, grilled, fried, slow-cooked, steamed, raw"
      }
    }

    Important guidelines:
    1. Analyze the recipe content carefully to determine:
       - Meal type based on ingredients and serving suggestions
       - Dietary restrictions based on ingredients used
       - Difficulty level based on number of steps and techniques required
       - Cuisine type based on ingredients and cooking style
       - Cooking method based on the primary cooking technique used
    2. ALL five category fields must be filled with appropriate values
    3. Extract all measurements and quantities precisely
    4. Return ONLY the JSON object, no other text
    5. All number fields should be integers
    6. If any information is missing, use reasonable estimates based on similar recipes
    7. Clean up any formatting issues in the text
    8. Make sure all text content is properly translated into ${languageName}`;

    console.log('Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    
    if (!result.response) {
      throw new Error('Empty response from AI');
    }

    const resultText = result.response.text();
    console.log('Received response from Gemini');

    try {
      // Try to extract JSON from the response
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to extract recipe data');
      }

      const recipeData = JSON.parse(jsonMatch[0]);

      // Validate required fields
      const requiredFields = [
        'title', 'description', 'ingredients', 'instructions',
        'prep_time', 'cook_time', 'estimated_calories',
        'suggested_portions', 'portion_description', 'categories'
      ];

      for (const field of requiredFields) {
        if (!recipeData[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      // Validate categories
      const requiredCategories = ['meal_type', 'dietary_restrictions', 'difficulty_level', 'cuisine_type', 'cooking_method'];
      for (const category of requiredCategories) {
        if (!recipeData.categories[category]) {
          throw new Error(`Missing required category: ${category}`);
        }
      }

      // Ensure categories is an array with 2-4 items
      if (!Array.isArray(recipeData.categories)) {
        throw new Error('categories must be an object with all required fields');
      }

      return new Response(
        JSON.stringify(recipeData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Failed to parse recipe data:', error);
      throw new Error(`Failed to parse recipe data: ${error.message}`);
    }

  } catch (error) {
    console.error('Error in ai-recipe-import function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
