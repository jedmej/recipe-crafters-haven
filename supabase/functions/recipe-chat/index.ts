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
    occasion?: string;
    course_category?: string;
    taste_profile?: string[];
  };
}

const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'pl': 'Polish',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'ru': 'Russian',
  'uk': 'Ukrainian'
};

// Define the category options that match the frontend
const CATEGORY_OPTIONS = {
  meal_type: [
    "Breakfast", "Brunch", "Lunch", "Dinner", "Snacks", "Dessert", 
    "Appetizer", "Soup", "Side Dish"
  ],
  dietary_restrictions: [
    "Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", 
    "Paleo", "Halal", "Kosher", "Nut-free", "Low-Sodium"
  ],
  difficulty_level: ["Easy", "Medium", "Hard", "Expert"],
  cuisine_type: [
    "Italian", "Mexican", "Chinese", "Japanese", "Thai", "French", 
    "Middle Eastern", "Indian", "American", "Mediterranean", 
    "Caribbean", "Greek", "Spanish"
  ],
  cooking_method: [
    "Baking", "Frying", "Grilling", "Roasting", "Steaming", 
    "Boiling", "Slow Cooking", "Sous Vide"
  ],
  occasion: ["Everyday", "Party", "Holiday", "Birthday"],
  course_category: ["Soup", "Salad", "Main Course", "Side Dish", "Dessert", "Beverage"],
  taste_profile: ["Sweet", "Savory", "Spicy", "Sour", "Salty", "Bitter", "Umami", "Tangy", "Mild"]
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

  // Add additional categories if they exist
  if (data.categories?.occasion) {
    cleanedData.categories.occasion = ensureString(data.categories.occasion, 'Everyday');
  }
  
  if (data.categories?.course_category) {
    cleanedData.categories.course_category = ensureString(data.categories.course_category, 'Main Course');
  }
  
  if (data.categories?.taste_profile) {
    cleanedData.categories.taste_profile = ensureArray(data.categories.taste_profile, ['Balanced']);
  }

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
      model: 'gemini-2.0-pro',
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
        maxOutputTokens: 2048,
      },
    });

    // Create the prompt for the AI
    let languageEmphasis = '';
    if (language === 'ru' || language === 'uk') {
      languageEmphasis = `IMPORTANT: I need this recipe SPECIFICALLY in ${SUPPORTED_LANGUAGES[language]} language, not in English. This is extremely important. ALL text fields including title, description, ingredients, instructions, and portion_description MUST be in ${SUPPORTED_LANGUAGES[language]} language using Cyrillic characters. DO NOT use English or Latin characters for any text content.`;
    }

    const prompt = `You are a helpful cooking assistant. Please create a recipe ENTIRELY in ${SUPPORTED_LANGUAGES[language]} language based on the user's request: "${query}"

    ${languageEmphasis}

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
        "meal_type": "One of: Breakfast, Brunch, Lunch, Dinner, Snacks, Dessert, Appetizer, Soup, Side Dish",
        "dietary_restrictions": ["Array of applicable options: Vegetarian, Vegan, Gluten-free, Dairy-free, Keto, Paleo, Halal, Kosher, Nut-free, Low-Sodium"],
        "difficulty_level": "One of: Easy, Medium, Hard, Expert",
        "cuisine_type": "One of: Italian, Mexican, Chinese, Japanese, Thai, French, Middle Eastern, Indian, American, Mediterranean, Caribbean, Greek, Spanish",
        "cooking_method": ["Array of applicable options: Baking, Frying, Grilling, Roasting, Steaming, Boiling, Slow Cooking, Sous Vide"],
        "occasion": "One of: Everyday, Party, Holiday, Birthday",
        "course_category": "One of: Soup, Salad, Main Course, Side Dish, Dessert, Beverage",
        "taste_profile": ["Array of applicable options: Sweet, Savory, Spicy, Sour, Salty, Bitter, Umami, Tangy, Mild"]
      }
    }

    Important:
    1. Return ONLY the JSON object, no other text or explanations
    2. All numbers must be integers
    3. All text MUST be in ${SUPPORTED_LANGUAGES[language]} language - this is CRITICAL
    4. Follow the exact structure shown above
    5. Make sure all fields are present and properly formatted
    6. ALL category fields must be filled with appropriate values
    7. For dietary_restrictions, cooking_method, and taste_profile, you can include multiple relevant tags as an array
    8. Try to use the exact category values provided in the lists above. If none match exactly, you can suggest a new appropriate value
    9. IMPORTANT: ALL text fields (title, description, ingredients, instructions, portion_description) MUST be in ${SUPPORTED_LANGUAGES[language]} language`;

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
        console.error('Failed to extract JSON. Raw response:', text);
        throw new Error('No valid JSON found in response');
      }

      let recipeData;
      try {
        // Normalize JSON string to handle potential Unicode issues
        const jsonString = jsonMatch[0]
          .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
          .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
          .replace(/\u2013/g, '-') // Replace en dash
          .replace(/\u2014/g, '--') // Replace em dash
          .replace(/\u2026/g, '...'); // Replace ellipsis
        
        const parsedData = JSON.parse(jsonString);
        recipeData = validateAndCleanRecipeData(parsedData);
        
        // Additional logging for debugging
        if (language === 'ru' || language === 'uk') {
          console.log('Successfully parsed recipe data for', SUPPORTED_LANGUAGES[language]);
        }
      } catch (parseError) {
        console.error('Error parsing or validating recipe data:', parseError);
        console.error('Problematic JSON string:', jsonMatch[0]);
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