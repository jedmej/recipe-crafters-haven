
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
    console.log('Importing recipe from URL:', url);

    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    if (!url || !url.startsWith('http')) {
      throw new Error('Invalid URL provided');
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    const crawlResponse = await firecrawl.crawlUrl(url, {
      limit: 1,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        timeout: 30000, // 30 second timeout
        waitUntil: 'networkidle0'
      }
    });

    console.log('Crawl response:', JSON.stringify(crawlResponse, null, 2));

    if (!crawlResponse.success) {
      throw new Error('Failed to scrape recipe data: ' + (crawlResponse.error || 'Unknown error'));
    }

    const content = crawlResponse.data?.[0]?.content;
    if (!content || !content.markdown) {
      throw new Error('No content found in webpage');
    }

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
      console.log('Attempting alternative content extraction method');
      
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

    if (ingredients.length === 0 && instructions.length === 0) {
      throw new Error('Could not extract recipe data from the page');
    }

    const recipe = {
      title,
      description,
      image_url: imageUrl,
      ingredients,
      instructions,
      servings: 1 // Default serving size
    };

    console.log('Successfully extracted recipe:', recipe);

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
    console.error('Error importing recipe:', error);
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
