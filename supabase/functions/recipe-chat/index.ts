import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from 'npm:@google/generative-ai@0.22.0';

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
  categories: {
    meal_type: string;
    dietary_restrictions: string[];
    difficulty_level: string;
    cuisine_type: string;
    cooking_method: string[];
  };
}

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'pl': 'Polish',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian'
};

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
      dietary_restrictions: ensureArray(data.categories?.dietary_restrictions, ['none']),
      difficulty_level: ensureString(data.categories?.difficulty_level, 'intermediate'),
      cuisine_type: ensureString(data.categories?.cuisine_type, 'other'),
      cooking_method: ensureArray(data.categories?.cooking_method, ['other'])
    }
  };

  return cleanedData;
}

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

    // Initialize the Gemini client with proper configuration
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Configure the model with safety settings and generation config
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
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
      "portion_description": "Portion size description in ${SUPPORTED_LANGUAGES[language]}",
      "categories": {
        "meal_type": "One of: breakfast, lunch, dinner, snack, dessert",
        "dietary_restrictions": ["Array of applicable options: vegetarian, vegan, gluten-free, low-carb, dairy-free, none"],
        "difficulty_level": "One of: easy, intermediate, advanced",
        "cuisine_type": "One of: Italian, Mexican, Asian, Mediterranean, French, American, Indian, etc.",
        "cooking_method": ["Array of applicable options: baked, grilled, fried, slow-cooked, steamed, raw"]
      }
    }

    Important:
    1. Return ONLY the JSON object, no other text or explanations
    2. All numbers must be integers
    3. All text must be in ${SUPPORTED_LANGUAGES[language]}
    4. Follow the exact structure shown above
    5. Make sure all fields are present and properly formatted
    6. ALL category fields must be filled with appropriate values
    7. For dietary_restrictions and cooking_method, you can include multiple relevant tags as an array
    8. For portion suggestions, analyze the dish type and provide realistic portions:
       - Single-serve items (toast, sandwich): typically 1-2 portions
       - Family meals (casseroles, lasagna): typically 6-8 portions
       - Baked goods (cookies, muffins): typically 12-24 portions
       - Pizza: typically 6-8 slices
    9. The portion_description should clearly describe what a portion means (e.g., "slices" for pizza, "cookies" for cookie recipes, "servings" for casseroles)`;

    try {
      console.log('Sending request to Gemini...');
      const result = await model.generateContent(prompt);
      
      if (!result.response) {
        throw new Error('Empty response from Gemini');
      }

      const text = result.response.text();
      console.log('Raw response text:', text);

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
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
        JSON.stringify({
          success: true,
          data: recipeData,
          defaultServingSize: recipeData.suggested_portions,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Check if it's a rate limit or overload error
      if (error.message?.includes('503') || error.message?.includes('overloaded')) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'The AI service is currently busy. Please try again in a few moments.',
            retryable: true
          }),
          { 
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          details: error instanceof Error ? error.stack : 'Unknown error'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: error instanceof Error ? error.stack : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});