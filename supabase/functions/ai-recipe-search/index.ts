import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';
import { cleanJsonResponse, validateRecipeData } from './utils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, language = 'pl' } = await req.json();
    console.log('Received query:', query, 'language:', language);
    
    if (!query || typeof query !== 'string') {
      throw new Error('Invalid query provided');
    }

    const apiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
    if (!apiKey) {
      console.error('Missing GOOGLE_GEMINI_KEY environment variable');
      throw new Error('AI service configuration error: Missing API key');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // Helper function to check if error is related to overload
    function isOverloadError(error: any): boolean {
      const errorMessage = error.message?.toLowerCase() || '';
      return (
        errorMessage.includes('busy') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('unavailable') ||
        errorMessage.includes('503') ||
        errorMessage.includes('service unavailable') ||
        errorMessage.includes('try again later')
      );
    }

    // Helper function to add delay between retries
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    async function tryGenerateContent(model: any, prompt: any, retryCount = 2): Promise<any> {
      for (let attempt = 0; attempt <= retryCount; attempt++) {
        try {
          if (attempt > 0) {
            console.log(`Retry attempt ${attempt} after delay...`);
            await delay(1000 * attempt); // Exponential backoff: 1s, 2s
          }
          return await model.generateContent(prompt);
        } catch (error) {
          if (attempt === retryCount || !isOverloadError(error)) {
            throw error;
          }
          console.log(`Attempt ${attempt + 1} failed, retrying...`);
        }
      }
    }

    async function generateWithFallback(prompt: any) {
      const models = [
        { name: 'gemini-2.0-flash', displayName: 'primary model (2.0 Flash)' },
        { name: 'gemini-2.0-flash-lite-preview-02-05', displayName: 'lite model (2.0 Flash-Lite)' },
        { name: 'gemini-1.5-flash', displayName: 'fallback model (1.5 Flash)' }
      ];

      for (const [index, modelInfo] of models.entries()) {
        try {
          console.log(`Attempting with ${modelInfo.displayName}...`);
          const model = genAI.getGenerativeModel({ 
            model: modelInfo.name,
            generationConfig: {
              temperature: 0.1,  // Lower temperature for more consistent output
              topP: 0.1,        // More focused sampling
              topK: 16,         // More deterministic output
            },
          });

          // Set generation parameters
          const result = await model.generateContent({
            contents: [{
              role: 'user',
              parts: [{
                text: `Create a recipe for: "${query}" in ${language} language.

                Return a JSON object with this structure:
                {
                  "title": "Recipe title",
                  "description": "Brief description",
                  "ingredients": ["List of ingredients with quantities"],
                  "instructions": ["Step by step instructions"],
                  "prep_time": number (in minutes),
                  "cook_time": number (in minutes),
                  "estimated_calories": number,
                  "suggested_portions": number,
                  "portion_description": "Portion size description"
                }

                Rules:
                1. Use ${language} language for all text
                2. Use common measurements in ${language}
                3. Make instructions clear and detailed
                4. All numbers must be integers
                5. Return ONLY the JSON object, no markdown or formatting`
              }]
            }],
            generationConfig: {
              temperature: 0.1,
              topP: 0.1,
              topK: 16,
            },
          });

          return result;
        } catch (error) {
          const isLastModel = index === models.length - 1;
          if (isLastModel || !isOverloadError(error)) {
            throw error;
          }
          console.log(`${modelInfo.displayName} overloaded, trying next model...`);
        }
      }
    }

    try {
      console.log('Sending prompt to Gemini...');
      const result = await generateWithFallback({
        contents: [{
          role: 'user',
          parts: [{
            text: `Create a recipe for: "${query}" in ${language} language.

            Return a JSON object with this structure:
            {
              "title": "Recipe title",
              "description": "Brief description",
              "ingredients": ["List of ingredients with quantities"],
              "instructions": ["Step by step instructions"],
              "prep_time": number (in minutes),
              "cook_time": number (in minutes),
              "estimated_calories": number,
              "suggested_portions": number,
              "portion_description": "Portion size description"
            }

            Rules:
            1. Use ${language} language for all text
            2. Use common measurements in ${language}
            3. Make instructions clear and detailed
            4. All numbers must be integers
            5. Return ONLY the JSON object, no markdown or formatting`
          }]
        }]
      });

      console.log('Received response from Gemini');
      
      if (!result?.response) {
        return new Response(
          JSON.stringify({
            error: 'Empty response from AI service',
            success: false,
            data: null
          }), 
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      const rawText = result.response.text();
      console.log('Raw response text:', rawText);

      if (!rawText) {
        console.error('Empty text response received from AI service');
        return new Response(
          JSON.stringify({
            error: 'Empty text response from AI service',
            success: false,
            data: null,
            rawResponse: null
          }), 
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      let cleanedJson;
      try {
        console.log('Attempting to clean JSON response...');
        cleanedJson = cleanJsonResponse(rawText);
        console.log('Successfully cleaned JSON:', cleanedJson);
        
        console.log('Parsing cleaned JSON...');
        const recipeData = JSON.parse(cleanedJson);
        console.log('Successfully parsed JSON, validating...');
        
        validateRecipeData(recipeData);
        console.log('Validation passed, returning recipe data');

        return new Response(
          JSON.stringify({
            success: true,
            data: recipeData,
            error: null
          }), 
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('Recipe data processing error:', error);
        console.error('Raw text that failed:', rawText);
        return new Response(
          JSON.stringify({
            error: `Failed to process recipe data: ${error.message}`,
            success: false,
            data: null,
            rawResponse: rawText,
            processingStage: error.processingStage || 'unknown'
          }), 
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }
    } catch (error) {
      console.error('Edge function error:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      let status = 400;
      let errorMessage = error.message;

      if (error.message?.includes('API key')) {
        status = 500;
        errorMessage = 'AI service configuration error. Please contact support.';
      } else if (error.message?.includes('Invalid recipe format')) {
        status = 400;
        errorMessage = 'Failed to generate a valid recipe. Please try again.';
      } else if (error.message?.includes('busy') || error.message?.includes('overloaded')) {
        status = 503;
        errorMessage = 'The AI service is temporarily busy. Please try again in a few moments.';
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
          success: false,
          data: null,
          errorDetails: {
            message: error.message,
            type: error.name
          }
        }), 
        { 
          status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    
    let status = 400;
    let errorMessage = error.message;

    if (error.message?.includes('API key')) {
      status = 500;
      errorMessage = 'AI service configuration error. Please contact support.';
    } else if (error.message?.includes('Invalid recipe format')) {
      status = 400;
      errorMessage = 'Failed to generate a valid recipe. Please try again.';
    } else if (error.message?.includes('busy') || error.message?.includes('overloaded')) {
      status = 503;
      errorMessage = 'The AI service is temporarily busy. Please try again in a few moments.';
    }

    return new Response(
      JSON.stringify({ error: errorMessage }), 
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
