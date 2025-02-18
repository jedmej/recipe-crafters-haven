
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchWebContent(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
  });
  if (!response.ok) throw new Error('Failed to fetch webpage');
  return response.text();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL provided');
    }

    console.log('Processing URL:', url);
    const content = await fetchWebContent(url);
    console.log('Fetched content length:', content.length);

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      throw new Error('AI service is not properly configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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
    
    Important: Your response must be ONLY the JSON object, with no additional text or formatting.`;

    console.log('Sending request to Gemini...');
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log('Raw Gemini response:', text);
    
    try {
      // Try to clean the response if it contains additional text
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;
      console.log('Cleaned JSON text:', jsonText);
      
      const recipeData = JSON.parse(jsonText);
      
      // Validate recipe data
      if (!recipeData.title || !recipeData.ingredients || !recipeData.instructions) {
        console.error('Invalid recipe structure:', recipeData);
        throw new Error('Generated recipe data is missing required fields');
      }

      console.log('Successfully parsed recipe data');
      return new Response(JSON.stringify(recipeData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('JSON parsing error:', error);
      console.error('Attempted to parse:', text);
      throw new Error(`Failed to parse recipe data: ${error.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: 'Check the function logs for more information'
      }), 
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
