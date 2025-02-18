
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from 'npm:@mendable/firecrawl-js@latest';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Starting recipe import process for URL:', url);

    if (!firecrawlApiKey) {
      console.error('Firecrawl API key not found in environment variables');
      throw new Error('Firecrawl API key not configured');
    }

    if (!url || !url.startsWith('http')) {
      console.error('Invalid URL provided:', url);
      throw new Error('Invalid URL provided');
    }

    console.log('Initializing Firecrawl with API key');
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    console.log('Setting up crawl options');
    const crawlOptions = {
      limit: 1,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        timeout: 30000
      }
    };
    
    console.log('Crawl options:', JSON.stringify(crawlOptions, null, 2));

    console.log('Starting webpage crawl');
    const crawlResponse = await firecrawl.crawlUrl(url, crawlOptions);

    console.log('Raw crawl response:', JSON.stringify(crawlResponse, null, 2));

    if (!crawlResponse.success) {
      console.error('Crawl failed:', crawlResponse.error || 'Unknown error');
      throw new Error('Failed to scrape recipe data: ' + (crawlResponse.error || 'Unknown error'));
    }

    const content = crawlResponse.data?.[0]?.content;
    if (!content || !content.markdown) {
      console.error('No content found in response:', JSON.stringify(content, null, 2));
      throw new Error('No content found in webpage');
    }

    console.log('Successfully retrieved content, parsing recipe data');

    // Extract recipe data from the scraped content
    const title = content.title || 'Untitled Recipe';
    const description = content.description || '';
    const imageUrl = content.images?.[0] || '';

    // Initialize arrays for ingredients and instructions
    const ingredients: string[] = [];
    const instructions: string[] = [];

    // Split content into sections and process them
    const sections = content.markdown.split('\n\n');
    let currentSection = '';

    console.log('Processing content sections');
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

      // Process lines based on current section
      const lines = section.split('\n');
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // Skip lines that look like headers
        if (trimmedLine.startsWith('#')) continue;

        if (currentSection === 'ingredients' && !ingredients.includes(trimmedLine)) {
          // Only add if it looks like an ingredient (contains numbers or common measurements)
          if (/\d/.test(trimmedLine) || /cup|tablespoon|teaspoon|gram|oz|pound|ml|g|tbsp|tsp/i.test(trimmedLine)) {
            ingredients.push(trimmedLine);
          }
        }
        if (currentSection === 'instructions' && !instructions.includes(trimmedLine)) {
          instructions.push(trimmedLine);
        }
      }
    }

    // If we couldn't find structured ingredients/instructions, try a different approach
    if (ingredients.length === 0 || instructions.length === 0) {
      console.log('Using alternative content extraction method');
      
      const allLines = content.markdown.split('\n');
      for (const line of allLines) {
        const trimmedLine = line.trim();
        if (!trimmedLine || trimmedLine.startsWith('#')) continue;

        // Try to identify ingredients by common patterns
        if (/\d/.test(trimmedLine) && 
            /cup|tablespoon|teaspoon|gram|oz|pound|ml|g|tbsp|tsp/i.test(trimmedLine) &&
            !ingredients.includes(trimmedLine)) {
          ingredients.push(trimmedLine);
        }
        // Try to identify instructions by sentence structure
        else if (/^[0-9]+\.|^[•\-\*]|^step/i.test(trimmedLine) && 
                !instructions.includes(trimmedLine)) {
          instructions.push(trimmedLine);
        }
      }
    }

    console.log('Found ingredients:', ingredients.length);
    console.log('Found instructions:', instructions.length);

    if (ingredients.length === 0 && instructions.length === 0) {
      console.error('No recipe content could be extracted');
      throw new Error('Could not extract recipe data from the page');
    }

    const recipe = {
      title,
      description,
      image_url: imageUrl,
      ingredients,
      instructions,
      servings: 1
    };

    console.log('Successfully created recipe object:', JSON.stringify(recipe, null, 2));

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
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        }
      }
    );
  }
});
