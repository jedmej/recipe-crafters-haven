import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from 'npm:@google/generative-ai@0.22.0';

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
    dietary_restrictions: string[] | string;
    difficulty_level: string;
    cuisine_type: string;
    cooking_method: string[] | string;
    occasion?: string;
    course_category?: string;
    taste_profile?: string[] | string;
  };
}

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
      meal_type: ensureString(data.categories?.meal_type, 'Main Dish'),
      dietary_restrictions: data.categories?.dietary_restrictions ? 
        (Array.isArray(data.categories.dietary_restrictions) ? 
          data.categories.dietary_restrictions : [data.categories.dietary_restrictions]) : 
        ['Regular'],
      difficulty_level: ensureString(data.categories?.difficulty_level, 'Medium'),
      cuisine_type: ensureString(data.categories?.cuisine_type, 'International'),
      cooking_method: data.categories?.cooking_method ? 
        (Array.isArray(data.categories.cooking_method) ? 
          data.categories.cooking_method : [data.categories.cooking_method]) : 
        ['Various']
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
    cleanedData.categories.taste_profile = Array.isArray(data.categories.taste_profile) ? 
      data.categories.taste_profile : [data.categories.taste_profile];
  }

  return cleanedData;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      ingredients = [], 
      targetLanguage = 'en',
      cookingTime = 30,
      filters = [],
      categoryFilters = {},
      measurementSystem = 'metric',
      useIngredients = false,
      generateAllCategories = true
    } = await req.json();
    
    console.log('Generating recipe with parameters:', {
      ingredientsCount: ingredients.length,
      targetLanguage,
      cookingTime,
      filtersCount: filters.length,
      categoryFilters,
      measurementSystem,
      useIngredients,
      generateAllCategories
    });

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service is not properly configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
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
      }
    });

    const languageName = SUPPORTED_LANGUAGES[targetLanguage] || 'English';
    
    // Build the prompt based on the input parameters
    let promptBase = `You are a creative recipe generator. Create a delicious recipe ENTIRELY in ${languageName} language. It is CRITICAL that you use ONLY the ${languageName} language for ALL text in the response, including the title, description, ingredients, and instructions.`;
    
    // Add special instructions for Russian and Ukrainian
    if (targetLanguage === 'ru' || targetLanguage === 'uk') {
      promptBase += ` I need this recipe SPECIFICALLY in ${languageName} language, not in English. This is extremely important. ALL text fields including title, description, ingredients, instructions, and portion_description MUST be in ${languageName} language using Cyrillic characters. DO NOT use English or Latin characters for any text content.`;
    }
    
    // Add ingredient constraints if needed
    if (useIngredients && ingredients.length > 0) {
      promptBase += ` using these ingredients: ${ingredients.join(', ')}`;
    }
    
    // Add cooking time constraint
    promptBase += `. The recipe should take about ${cookingTime} minutes to prepare and cook.`;
    
    // Add category filters
    if (filters.length > 0) {
      promptBase += ` The recipe should match these criteria: ${filters.join(', ')}.`;
    }
    
    // Add specific category filters
    const specificFilters = [];
    if (categoryFilters.meal_type) specificFilters.push(`Meal type: ${categoryFilters.meal_type}`);
    if (categoryFilters.dietary_restrictions) specificFilters.push(`Dietary restrictions: ${categoryFilters.dietary_restrictions}`);
    if (categoryFilters.difficulty_level) specificFilters.push(`Difficulty level: ${categoryFilters.difficulty_level}`);
    if (categoryFilters.cuisine_type) specificFilters.push(`Cuisine type: ${categoryFilters.cuisine_type}`);
    if (categoryFilters.cooking_method) specificFilters.push(`Cooking method: ${categoryFilters.cooking_method}`);
    if (categoryFilters.occasion) specificFilters.push(`Occasion: ${categoryFilters.occasion}`);
    if (categoryFilters.course_category) specificFilters.push(`Course category: ${categoryFilters.course_category}`);
    if (categoryFilters.taste_profile) specificFilters.push(`Taste profile: ${categoryFilters.taste_profile}`);
    
    if (specificFilters.length > 0) {
      promptBase += ` Specifically, it should match: ${specificFilters.join('; ')}.`;
    }
    
    // Add measurement system preference
    promptBase += ` Use ${measurementSystem} measurements.`;
    
    // Complete the prompt with the JSON structure request
    const prompt = `${promptBase}

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
        "meal_type": "One of: ${CATEGORY_OPTIONS.meal_type.join(', ')}",
        "dietary_restrictions": ["Array of applicable options: ${CATEGORY_OPTIONS.dietary_restrictions.join(', ')}"],
        "difficulty_level": "One of: ${CATEGORY_OPTIONS.difficulty_level.join(', ')}",
        "cuisine_type": "One of: ${CATEGORY_OPTIONS.cuisine_type.join(', ')}",
        "cooking_method": ["Array of applicable options: ${CATEGORY_OPTIONS.cooking_method.join(', ')}"],
        "occasion": "One of: ${CATEGORY_OPTIONS.occasion.join(', ')}",
        "course_category": "One of: ${CATEGORY_OPTIONS.course_category.join(', ')}",
        "taste_profile": ["Array of applicable options: ${CATEGORY_OPTIONS.taste_profile.join(', ')}"]
      }
    }

    Important:
    1. Return ONLY the JSON object, no other text or explanations
    2. All numbers must be integers
    3. All text MUST be in ${languageName} language - this is CRITICAL
    4. Follow the exact structure shown above
    5. Make sure all fields are present and properly formatted
    6. ALL category fields must be filled with appropriate values
    7. For dietary_restrictions, cooking_method, and taste_profile, you can include multiple relevant tags as an array
    8. Try to use the exact category values provided in the lists above. If none match exactly, you can suggest a new appropriate value
    9. For portion suggestions, analyze the dish type and provide realistic portions:
       - Single-serve items (toast, sandwich): typically 1-2 portions
       - Family meals (casseroles, lasagna): typically 4-6 portions
       - Baked goods (cookies, muffins): typically 12-24 portions
       - Pizza: typically 6-8 slices
    10. The portion_description should clearly describe what a portion means (e.g., "slices" for pizza, "cookies" for cookie recipes, "servings" for casseroles)
    11. IMPORTANT: ALL text fields (title, description, ingredients, instructions, portion_description) MUST be in ${languageName} language`;
    
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
        // Normalize JSON string to handle potential Unicode issues
        const jsonString = jsonMatch[0]
          .replace(/[\u2018\u2019]/g, "'") // Replace smart quotes
          .replace(/[\u201C\u201D]/g, '"') // Replace smart double quotes
          .replace(/\u2013/g, '-') // Replace en dash
          .replace(/\u2014/g, '--') // Replace em dash
          .replace(/\u2026/g, '...'); // Replace ellipsis
        
        // For Russian and Ukrainian, add extra handling for potential JSON issues
        let processedJsonString = jsonString;
        if (targetLanguage === 'ru' || targetLanguage === 'uk') {
          // Fix common JSON syntax errors that might occur with Cyrillic text
          processedJsonString = processedJsonString
            // Fix unescaped quotes within strings
            .replace(/"([^"]*?)(?<!\\)"([^"]*?)"/g, (match, p1, p2) => {
              return `"${p1.replace(/"/g, '\\"')}${p2.replace(/"/g, '\\"')}"`;
            })
            // Fix trailing commas in arrays and objects
            .replace(/,\s*]/g, ']')
            .replace(/,\s*}/g, '}');
        }
        
        const parsedData = JSON.parse(processedJsonString);
        recipeData = validateAndCleanRecipeData(parsedData);
        
        // Additional logging for debugging
        if (targetLanguage === 'ru' || targetLanguage === 'uk') {
          console.log('Successfully parsed recipe data for', languageName);
        }
      } catch (parseError) {
        console.error('Error parsing or validating recipe data:', parseError);
        console.error('Problematic JSON string:', jsonMatch[0]);
        
        // For Russian and Ukrainian, try a more aggressive fallback approach
        if (targetLanguage === 'ru' || targetLanguage === 'uk') {
          try {
            console.log('Attempting fallback JSON parsing for Cyrillic text...');
            
            // Try to extract individual fields using regex patterns
            const titleMatch = text.match(/"title"\s*:\s*"([^"]+)"/);
            const descriptionMatch = text.match(/"description"\s*:\s*"([^"]+)"/);
            
            // Create a minimal valid JSON structure
            const minimalJson = {
              title: titleMatch ? titleMatch[1] : 'Untitled Recipe',
              description: descriptionMatch ? descriptionMatch[1] : '',
              ingredients: [],
              instructions: [],
              prep_time: 30,
              cook_time: 30,
              estimated_calories: 0,
              suggested_portions: 4,
              portion_description: 'servings',
              categories: {
                meal_type: 'Main Course',
                dietary_restrictions: ['Regular'],
                difficulty_level: 'Medium',
                cuisine_type: 'International',
                cooking_method: ['Various']
              }
            };
            
            console.log('Using fallback minimal JSON structure');
            recipeData = minimalJson;
          } catch (fallbackError) {
            console.error('Fallback parsing also failed:', fallbackError);
            throw parseError; // Throw the original error
          }
        } else {
          throw parseError;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: recipeData
        }),
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
    console.error('Error in ai-recipe-generate function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}); 