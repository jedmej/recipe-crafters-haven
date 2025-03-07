import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@1.2.0';
import { HarmCategory, HarmBlockThreshold } from 'npm:@google/generative-ai@1.2.0';

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
    'pl': 'Polish',
    'ru': 'Russian',
    'uk': 'Ukrainian'
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

    const languageName = getLanguageName(targetLanguage);
    
    // Add special emphasis for Russian and Ukrainian
    let languageEmphasis = '';
    if (targetLanguage === 'ru' || targetLanguage === 'uk') {
      languageEmphasis = `IMPORTANT: I need this recipe SPECIFICALLY in ${languageName} language, not in English. This is extremely important. ALL text fields including title, description, ingredients, instructions, and portion_description MUST be in ${languageName} language using Cyrillic characters. DO NOT use English or Latin characters for any text content.`;
    }
    
    // Create the prompt for the AI
    const prompt = `You are a recipe extraction expert. Extract recipe information from this webpage content and translate it ENTIRELY into ${languageName}.

    ${languageEmphasis}

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
        "meal_type": "One of: Breakfast, Brunch, Lunch, Dinner, Snacks, Dessert, Appetizer, Soup, Side Dish",
        "dietary_restrictions": "One of: Vegetarian, Vegan, Gluten-free, Dairy-free, Keto, Paleo, Halal, Kosher, Nut-free, Low-Sodium",
        "difficulty_level": "One of: Easy, Medium, Hard, Expert",
        "cuisine_type": "One of: Italian, Mexican, Chinese, Japanese, Thai, French, Middle Eastern, Indian, American, Mediterranean, Caribbean, Greek, Spanish"
      }
    }

    Important:
    1. Return ONLY the JSON object, no other text or explanations
    2. All numbers must be integers
    3. All text MUST be in ${languageName} language - this is CRITICAL
    4. Follow the exact structure shown above
    5. Make sure all fields are present and properly formatted
    6. IMPORTANT: ALL text fields (title, description, ingredients, instructions, portion_description) MUST be in ${languageName} language`;
    
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
                meal_type: 'Main Dish',
                dietary_restrictions: 'Regular',
                difficulty_level: 'Medium',
                cuisine_type: 'International'
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
