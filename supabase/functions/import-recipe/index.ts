
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import FirecrawlApp from 'npm:@mendable/firecrawl-js@latest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY') || '';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    // Get URL from request body
    const { url } = await req.json();
    console.log('Starting recipe import for URL:', url);

    if (!firecrawlApiKey) {
      console.error('Firecrawl API key not found');
      throw new Error('Firecrawl API key not configured');
    }

    if (!url || !url.startsWith('http')) {
      console.error('Invalid URL:', url);
      throw new Error('Invalid URL provided');
    }

    console.log('Initializing Firecrawl');
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    const crawlOptions = {
      limit: 1,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        timeout: 30000
      }
    };

    console.log('Starting crawl with options:', JSON.stringify(crawlOptions));
    const crawlResponse = await firecrawl.crawlUrl(url, crawlOptions);

    console.log('Crawl response:', JSON.stringify(crawlResponse, null, 2));

    if (!crawlResponse.success) {
      throw new Error(crawlResponse.error || 'Failed to crawl webpage');
    }

    if (!crawlResponse.data?.[0]?.content) {
      throw new Error('No content found in webpage');
    }

    const content = crawlResponse.data[0].content;
    console.log('Processing content:', JSON.stringify(content, null, 2));

    const title = content.title || 'Untitled Recipe';
    const description = content.description || '';
    const imageUrl = content.images?.[0] || '';
    const ingredients: string[] = [];
    const instructions: string[] = [];

    // Try to extract from HTML content first
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
          if (text && !ingredients.includes(text)) {
            ingredients.push(text);
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
          if (text && !instructions.includes(text)) {
            instructions.push(text);
          }
        });
        break;
      }
    }

    // Fallback to markdown content if HTML parsing didn't work
    if (ingredients.length === 0 || instructions.length === 0) {
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

          if (currentSection === 'ingredients' && !ingredients.includes(trimmedLine)) {
            if (/\d/.test(trimmedLine) || /cup|tablespoon|teaspoon|gram|oz|pound|ml|g|tbsp|tsp/i.test(trimmedLine)) {
              ingredients.push(trimmedLine);
            }
          }
          if (currentSection === 'instructions' && !instructions.includes(trimmedLine)) {
            instructions.push(trimmedLine);
          }
        }
      }
    }

    if (ingredients.length === 0 || instructions.length === 0) {
      console.error('Failed to extract recipe content');
      throw new Error('Could not find recipe content on the page');
    }

    const recipe = {
      title,
      description,
      image_url: imageUrl,
      ingredients,
      instructions,
      servings: 1
    };

    console.log('Successfully extracted recipe:', JSON.stringify(recipe, null, 2));

    return new Response(
      JSON.stringify(recipe),
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
        status: error instanceof Error && error.message === 'Unauthorized' ? 401 : 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
