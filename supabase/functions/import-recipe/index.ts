import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'npm:@mendable/firecrawl-js@latest';
import { GoogleGenerativeAI } from '@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const geminiApiKey = Deno.env.get('GOOGLE_GEMINI_KEY');

async function fetchWebContent(url: string): Promise<string> {
  console.log('Fetching web content from:', url);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
  }
  const text = await response.text();
  console.log('Successfully fetched web content');
  return text;
}

async function extractRecipeWithGemini(url: string): Promise<any> {
  if (!geminiApiKey) {
    throw new Error('Gemini API key not configured');
  }

  console.log('Attempting to extract recipe with Gemini from URL:', url);
  
  try {
    // Fetch the webpage content first
    const pageContent = await fetchWebContent(url);
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Given the following webpage content, extract the recipe information.
    Return ONLY a JSON object with these fields:
    {
      "title": "Recipe title",
      "description": "Brief description",
      "ingredients": ["array", "of", "ingredients"],
      "instructions": ["array", "of", "step by step", "instructions"]
    }
    
    Webpage content:
    ${pageContent.slice(0, 10000)} # Limit content length to avoid token limits

    Return valid JSON only, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in Gemini response');
      throw new Error('Failed to extract recipe data');
    }
    
    const recipeData = JSON.parse(jsonMatch[0]);
    console.log('Successfully extracted recipe with Gemini:', recipeData);

    // Validate the recipe data structure
    if (!recipeData.title || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.instructions)) {
      throw new Error('Invalid recipe data format');
    }
    
    return recipeData;
  } catch (error) {
    console.error('Error in Gemini extraction:', error);
    throw new Error('Unable to extract recipe data');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Starting recipe import for URL:', url);

    if (!url || !url.startsWith('http')) {
      throw new Error('Invalid URL provided');
    }

    let recipe = null;
    let usedFallback = false;

    // Try Firecrawl first
    try {
      if (!firecrawlApiKey) {
        throw new Error('Firecrawl API key not configured');
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

      if (!crawlResponse.success || !crawlResponse.data?.[0]?.content) {
        throw new Error('No content found in webpage');
      }

      const content = crawlResponse.data[0].content;
      recipe = {
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

      if (!recipe.ingredients.length || !recipe.instructions.length) {
        throw new Error('Could not find recipe content');
      }

    } catch (scrapingError) {
      console.log('Firecrawl extraction failed, trying Gemini fallback:', scrapingError);
      
      try {
        const geminiRecipe = await extractRecipeWithGemini(url);
        recipe = {
          ...geminiRecipe,
          image_url: '',
          servings: 1
        };
        usedFallback = true;
      } catch (geminiError) {
        console.error('Gemini extraction failed:', geminiError);
        throw new Error('Unable to extract recipe data from the webpage');
      }
    }

    if (!recipe) {
      throw new Error('Failed to extract recipe data');
    }

    return new Response(
      JSON.stringify({ 
        ...recipe,
        usedFallback 
      }),
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
