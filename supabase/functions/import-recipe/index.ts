import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from 'npm:@mendable/firecrawl-js@latest';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

async function extractRecipeWithGemini(url: string): Promise<any> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  console.log('Attempting to extract recipe with Gemini from URL:', url);
  
  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `Visit this URL: ${url} and extract recipe information.
  Return ONLY a JSON object with these fields:
  {
    "title": "Recipe title",
    "description": "Brief description",
    "ingredients": ["array", "of", "ingredients"],
    "instructions": ["array", "of", "step by step", "instructions"]
  }
  Ensure the output is valid JSON. Do not include any other text.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  
  try {
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }
    
    const recipeData = JSON.parse(jsonMatch[0]);
    console.log('Successfully extracted recipe with Gemini:', recipeData);
    
    return recipeData;
  } catch (error) {
    console.error('Failed to parse Gemini response:', error);
    throw new Error('Failed to parse recipe with AI');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get URL from request body
    const { url } = await req.json();
    console.log('Starting recipe import for URL:', url);

    // Try Firecrawl first
    try {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured');
      }

      if (!url || !url.startsWith('http')) {
        throw new Error('Invalid URL provided');
      }

      console.log('Attempting to extract recipe with Firecrawl');
      const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

      const crawlResponse = await firecrawl.crawlUrl(url, {
        limit: 1,
        scrapeOptions: {
          formats: ['markdown', 'html'],
          timeout: 30000
        }
      });

      console.log('Firecrawl response:', JSON.stringify(crawlResponse, null, 2));

      if (!crawlResponse.success || !crawlResponse.data?.[0]?.content) {
        throw new Error('No content found in webpage');
      }

      const content = crawlResponse.data[0].content;
      const recipe = {
        title: content.title || 'Untitled Recipe',
        description: content.description || '',
        image_url: content.images?.[0] || '',
        ingredients: [],
        instructions: [],
        servings: 1
      };

      // Extract ingredients and instructions from HTML/markdown
      const htmlContent = content.html || '';
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');

      // Common selectors for recipe content
      const ingredientSelectors = ['[itemprop="recipeIngredient"]', '.ingredients', '#ingredients'];
      const instructionSelectors = ['[itemprop="recipeInstructions"]', '.instructions', '#instructions'];

      // Try to find ingredients from HTML structure
      for (const selector of ingredientSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && !recipe.ingredients.includes(text)) {
              recipe.ingredients.push(text);
            }
          });
          break;
        }
      }

      // Try to find instructions from HTML structure
      for (const selector of instructionSelectors) {
        const elements = doc.querySelectorAll(selector);
        if (elements.length > 0) {
          elements.forEach(el => {
            const text = el.textContent?.trim();
            if (text && !recipe.instructions.includes(text)) {
              recipe.instructions.push(text);
            }
          });
          break;
        }
      }

      // Fallback to markdown content if HTML parsing didn't work
      if (recipe.ingredients.length === 0 || recipe.instructions.length === 0) {
        console.log('Falling back to markdown content parsing');
        const markdown = content.markdown || '';
        const sections = markdown.split('\n\n');
        let currentSection = '';

        for (const section of sections) {
          const lowerSection = section.toLowerCase();
          
          if (lowerSection.includes('ingredient')) {
            currentSection = 'ingredients';
            continue;
          }
          if (lowerSection.includes('instruction') || lowerSection.includes('direction') || lowerSection.includes('method')) {
            currentSection = 'instructions';
            continue;
          }

          const lines = section.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) continue;

            if (currentSection === 'ingredients' && !recipe.ingredients.includes(trimmedLine)) {
              if (/\d/.test(trimmedLine) || /cup|tablespoon|teaspoon|gram|oz|pound|ml|g|tbsp|tsp/i.test(trimmedLine)) {
                recipe.ingredients.push(trimmedLine);
              }
            }
            if (currentSection === 'instructions' && !recipe.instructions.includes(trimmedLine)) {
              recipe.instructions.push(trimmedLine);
            }
          }
        }
      }

      if (recipe.ingredients.length === 0 || recipe.instructions.length === 0) {
        console.error('Failed to extract recipe content');
        throw new Error('Could not find recipe content on the page');
      }

      return new Response(
        JSON.stringify(recipe),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } catch (scrapingError) {
      // If Firecrawl fails, try Gemini
      console.log('Firecrawl extraction failed, falling back to Gemini:', scrapingError);
      
      try {
        const geminiRecipe = await extractRecipeWithGemini(url);
        
        return new Response(
          JSON.stringify({
            ...geminiRecipe,
            image_url: '', // Gemini doesn't extract images
            servings: 1
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      } catch (geminiError) {
        console.error('Gemini extraction failed:', geminiError);
        throw new Error('Unable to extract recipe data. Please try another URL or enter the recipe manually.');
      }
    }

  } catch (error) {
    console.error('Error in import-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to import recipe' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
