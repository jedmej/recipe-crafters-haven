
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
    const response = await fetch(url, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new Error('URL does not point to a valid webpage');
    }
    
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from webpage');
    }
    
    return text;
  } catch (error) {
    console.error('Error fetching web content:', error);
    throw error;
  }
}

async function extractRecipeWithGemini(url: string): Promise<any> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  console.log('Extracting recipe with Gemini from URL:', url);
  
  try {
    const pageContent = await fetchWebContent(url);
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Extract recipe information from this webpage content.
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
    
    Respond with ONLY the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      const recipeData = JSON.parse(text);
      console.log('Successfully parsed recipe data');
      return recipeData;
    } catch (error) {
      console.log('Direct JSON parse failed, trying to extract JSON');
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      
      const recipeData = JSON.parse(jsonMatch[0]);
      console.log('Successfully extracted and parsed JSON');
      return recipeData;
    }
  } catch (error) {
    console.error('Error in Gemini extraction:', error);
    throw new Error('Unable to extract recipe data');
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      throw new Error('Invalid request format');
    }

    const { url } = requestBody;
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error('Invalid URL provided');
    }

    console.log('Starting recipe import for URL:', url);
    
    const recipe = await extractRecipeWithGemini(url);
    
    if (!recipe) {
      throw new Error('Failed to extract recipe data');
    }

    const response = {
      ...recipe,
      image_url: '', // Gemini doesn't extract images
    };

    console.log('Returning recipe data:', JSON.stringify(response, null, 2));

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
        error: 'Sorry, we couldn\'t fetch this recipe from the URL. Please try another URL or enter it manually.' 
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
