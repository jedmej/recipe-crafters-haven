
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@^0.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROMPT = `As a culinary expert, provide a detailed recipe based on the user's request. Format your response as a JSON object with the following structure:
{
  "title": "Recipe Title",
  "description": "A brief description of the dish",
  "ingredients": ["List of ingredients with measurements"],
  "instructions": ["Step-by-step cooking instructions"]
}
Keep the response focused and make sure it's valid JSON. Do not include any additional text outside the JSON object.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    
    if (!apiKey) {
      throw new Error('Google Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    console.log('Searching for recipe:', query);

    const result = await model.generateContent([
      PROMPT,
      query
    ]);
    const response = await result.response;
    const text = response.text();
    
    try {
      const recipe = JSON.parse(text);
      console.log('Successfully generated recipe:', recipe);

      return new Response(
        JSON.stringify(recipe),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to generate a valid recipe format');
    }

  } catch (error) {
    console.error('Error generating recipe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
