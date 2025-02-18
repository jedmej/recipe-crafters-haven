
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

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    const crawlResponse = await firecrawl.crawlUrl(url, {
      limit: 1,
      scrapeOptions: {
        formats: ['markdown', 'html'],
      }
    });

    if (!crawlResponse.success) {
      throw new Error('Failed to scrape recipe data');
    }

    const content = crawlResponse.data[0]?.content;
    if (!content) {
      throw new Error('No content found in webpage');
    }

    // Extract recipe data from the scraped content
    const title = content.title || 'Untitled Recipe';
    const description = content.description || '';
    const imageUrl = content.images?.[0] || '';

    // Extract ingredients and instructions using common recipe page patterns
    const ingredients: string[] = [];
    const instructions: string[] = [];

    // Look for common recipe patterns in the content
    const sections = content.markdown.split('\n\n');
    for (const section of sections) {
      if (section.toLowerCase().includes('ingredients')) {
        const lines = section.split('\n').slice(1);
        ingredients.push(...lines.filter(line => line.trim()));
      }
      if (section.toLowerCase().includes('instructions') || 
          section.toLowerCase().includes('directions') || 
          section.toLowerCase().includes('method')) {
        const lines = section.split('\n').slice(1);
        instructions.push(...lines.filter(line => line.trim()));
      }
    }

    // If we couldn't find structured data, try to extract from the raw content
    if (ingredients.length === 0 || instructions.length === 0) {
      const lines = content.markdown.split('\n');
      let currentSection = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        if (trimmedLine.toLowerCase().includes('ingredients')) {
          currentSection = 'ingredients';
          continue;
        }
        if (trimmedLine.toLowerCase().includes('instructions') || 
            trimmedLine.toLowerCase().includes('directions') || 
            trimmedLine.toLowerCase().includes('method')) {
          currentSection = 'instructions';
          continue;
        }

        if (currentSection === 'ingredients' && !ingredients.includes(trimmedLine)) {
          ingredients.push(trimmedLine);
        }
        if (currentSection === 'instructions' && !instructions.includes(trimmedLine)) {
          instructions.push(trimmedLine);
        }
      }
    }

    if (ingredients.length === 0 || instructions.length === 0) {
      throw new Error('Could not extract recipe data from the page');
    }

    const recipe = {
      title,
      description,
      image_url: imageUrl,
      ingredients,
      instructions,
    };

    console.log('Successfully extracted recipe:', recipe);

    return new Response(
      JSON.stringify(recipe),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error importing recipe:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
