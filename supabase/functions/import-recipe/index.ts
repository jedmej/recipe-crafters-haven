
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
        'Accept': 'text/html',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text || text.trim().length === 0) {
      throw new Error('Empty response from webpage');
    }
    return text;
  } catch (error) {
    console.error('Error fetching web content:', error);
    throw new Error(`Failed to fetch webpage: ${error.message}`);
  }
}

async function processWithGemini(content: string): Promise<any> {
  if (!geminiApiKey) {
    throw new Error('Recipe import service is not properly configured');
  }

  try {
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
    ${content.slice(0, 10000)}
    
    Respond with ONLY the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      return JSON.parse(text);
    } catch (error) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in Gemini response');
      }
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error in Gemini processing:', error);
    throw new Error('Failed to process recipe data');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      throw new Error('Invalid URL provided');
    }

    // Fetch webpage content server-side
    const content = await fetchWebContent(url);
    
    // Process with Gemini
    const recipeData = await processWithGemini(content);

    // Validate recipe data
    if (!recipeData || !recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
      throw new Error('Invalid recipe data structure');
    }

    return new Response(
      JSON.stringify({
        ...recipeData,
        image_url: '', // No image processing for now
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error:', error);
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
