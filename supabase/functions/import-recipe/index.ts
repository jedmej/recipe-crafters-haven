
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'npm:@mendable/firecrawl-js@latest';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.1.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
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
    
    console.log('Successfully fetched web content');
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

  console.log('Attempting to extract recipe with Gemini from URL:', url);
  
  try {
    // Fetch the webpage content
    const pageContent = await fetchWebContent(url);
    
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `Extract recipe information from this webpage content.
    Return ONLY a valid JSON object with these exact fields:
    {
      "title": "Recipe title",
      "description": "Brief recipe description",
      "ingredients": ["list of ingredients"],
      "instructions": ["step by step instructions"]
    }
    
    Webpage content:
    ${pageContent.slice(0, 10000)}
    
    Respond with ONLY the JSON object, no other text.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    
    try {
      // First try direct JSON parsing
      const recipeData = JSON.parse(text);
      console.log('Successfully parsed JSON directly');
      return recipeData;
    } catch (error) {
      // If direct parsing fails, try to extract JSON from the text
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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
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

      console.log('Firecrawl response:', JSON.stringify(crawlResponse, null, 2));

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

    const response = {
      ...recipe,
      usedFallback
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
