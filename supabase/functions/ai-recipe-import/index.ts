import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@1.2.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Define the recipe data interface
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
  categories: {
    meal_type: string;
    dietary_restrictions: string;
    difficulty_level: string;
    cuisine_type: string;
    cooking_method: string;
  };
}

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

// Function to validate and clean recipe data
function validateAndCleanRecipeData(data: any): RecipeData {
  // Helper function to ensure number fields
  const ensureNumber = (value: any, defaultValue: number): number => {
    if (typeof value === 'number') return value;
    const num = parseInt(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Helper function to ensure array fields
  const ensureArray = (value: any, defaultValue: string[]): string[] => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return [value];
    return defaultValue;
  };

  // Helper function to ensure string fields
  const ensureString = (value: any, defaultValue: string): string => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (value && typeof value.toString === 'function') return value.toString().trim();
    return defaultValue;
  };

  // Clean and validate the data
  const cleanedData: RecipeData = {
    title: ensureString(data.title, 'Untitled Recipe'),
    description: ensureString(data.description, ''),
    ingredients: ensureArray(data.ingredients, []),
    instructions: ensureArray(data.instructions, []),
    prep_time: ensureNumber(data.prep_time, 0),
    cook_time: ensureNumber(data.cook_time, 0),
    estimated_calories: ensureNumber(data.estimated_calories, 0),
    suggested_portions: ensureNumber(data.suggested_portions, 1),
    portion_description: ensureString(data.portion_description, 'serving'),
    categories: {
      meal_type: ensureString(data.categories?.meal_type, 'other'),
      dietary_restrictions: ensureString(data.categories?.dietary_restrictions, 'none'),
      difficulty_level: ensureString(data.categories?.difficulty_level, 'intermediate'),
      cuisine_type: ensureString(data.categories?.cuisine_type, 'other'),
      cooking_method: ensureString(data.categories?.cooking_method, 'other')
    }
  };

  return cleanedData;
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
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      }
    });

    const languageName = getLanguageName(targetLanguage);
    
    // Create a prompt that explicitly asks for JSON
    const prompt = `You are a recipe extraction expert. Extract recipe information from this webpage content and translate it into ${languageName}.

    Webpage content:
    ${cleanedContent}

    Return ONLY a JSON object with this exact structure, and no other text:
    {
      "title": "Recipe title in ${languageName}",
      "description": "Brief description in ${languageName}",
      "ingredients": ["List of ingredients with quantities in ${languageName}"],
      "instructions": ["Step by step instructions in ${languageName}"],
      "prep_time": number (in minutes),
      "cook_time": number (in minutes),
      "estimated_calories": number (per serving),
      "suggested_portions": number,
      "portion_description": "Portion size description in ${languageName}",
      "categories": {
        "meal_type": "One of: breakfast, lunch, dinner, snack, dessert",
        "dietary_restrictions": "One of: vegetarian, vegan, gluten-free, low-carb, dairy-free, none",
        "difficulty_level": "One of: easy, intermediate, advanced",
        "cuisine_type": "One of: Italian, Mexican, Asian, Mediterranean, French, American, Indian, etc.",
        "cooking_method": "One of: baked, grilled, fried, slow-cooked, steamed, raw"
      }
    }

    Important:
    1. Return ONLY the JSON object, no other text or explanations
    2. All numbers must be integers
    3. All text must be in ${languageName}
    4. Follow the exact structure shown above
    5. Make sure all fields are present and properly formatted
    6. ALL category fields must be filled with appropriate values
    7. If any information is missing, make reasonable estimates based on similar recipes`;
    
    console.log('Sending prompt to Gemini...');
    
    try {
      const result = await model.generateContent(prompt);
      
      if (!result.response) {
        throw new Error('Empty response from Gemini');
      }

      const text = result.response.text();
      console.log('Received response from Gemini');

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Raw response:', text);
        throw new Error('No valid JSON found in response');
      }

      let recipeData;
      try {
        const parsedData = JSON.parse(jsonMatch[0]);
        recipeData = validateAndCleanRecipeData(parsedData);
      } catch (parseError) {
        console.error('Error parsing or validating recipe data:', parseError);
        throw new Error('Failed to parse recipe data from AI response');
      }

      return new Response(
        JSON.stringify(recipeData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (aiError) {
      console.error('Gemini API error:', aiError);
      
      // Check if it's a rate limit or overload error
      if (aiError.message?.includes('503') || aiError.message?.includes('overloaded')) {
        return new Response(
          JSON.stringify({ 
            error: 'The AI service is currently busy. Please try again in a few moments.' 
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      throw aiError;
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
