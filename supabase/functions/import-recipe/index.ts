
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_KEY');

async function fetchWebContent(url: string): Promise<string> {
  console.log('Fetching web content from:', url);
  try {
    const response = await fetch(url);
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from webpage');
    }
    return text;
  } catch (error) {
    console.error('Error fetching web content:', error);
    throw new Error(`Failed to fetch webpage content: ${error.message}`);
  }
}

async function extractRecipeWithGemini(url: string): Promise<any> {
  if (!geminiApiKey) {
    console.error('Gemini API key not found');
    throw new Error('Recipe import service is not properly configured');
  }

  console.log('Starting recipe extraction with Gemini');
  
  try {
    const pageContent = await fetchWebContent(url);
    console.log('Successfully fetched webpage content');
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    console.log('Sending content to Gemini for processing');
    const result = await model.generateContent({
      contents: [{
        parts: [{
          text: `Extract recipe information from this webpage content.
          Return ONLY a valid JSON object with these exact fields:
          {
            "title": "Recipe title",
            "description": "Brief recipe description",
            "ingredients": ["list of ingredients"],
            "instructions": ["step by step instructions"],
            "servings": 1
          }
          
          Webpage content:
          ${pageContent.slice(0, 10000)}
          
          Respond with ONLY the JSON object, no other text.`
        }]
      }]
    });

    const text = result.response.text();
    console.log('Received response from Gemini:', text);
    
    try {
      const recipeData = JSON.parse(text);
      console.log('Successfully parsed recipe data:', recipeData);
      return recipeData;
    } catch (parseError) {
      console.log('Direct JSON parse failed, trying to extract JSON');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      const recipeData = JSON.parse(jsonMatch[0]);
      console.log('Successfully extracted and parsed JSON:', recipeData);
      return recipeData;
    }
  } catch (error) {
    console.error('Error in Gemini extraction:', error);
    throw new Error(`Failed to extract recipe: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received import request');
    
    let requestBody;
    try {
      requestBody = await req.json();
      console.log('Request body:', requestBody);
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request format');
    }

    const { url } = requestBody;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error('Invalid URL provided');
    }

    console.log('Processing URL:', url);
    
    const recipe = await extractRecipeWithGemini(url);
    
    if (!recipe || !recipe.title || !recipe.ingredients || !recipe.instructions) {
      console.error('Invalid recipe data:', recipe);
      throw new Error('Failed to extract valid recipe data');
    }

    const response = {
      ...recipe,
      image_url: '',
    };

    console.log('Sending successful response:', response);

    return new Response(
      JSON.stringify(response),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in import-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to import recipe'
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 400
      }
    );
  }
});
