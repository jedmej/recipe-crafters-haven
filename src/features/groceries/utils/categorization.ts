/**
 * Categorizes a grocery item based on its name using AI
 * @param itemName The name of the grocery item to categorize
 * @returns The category name
 */

// Create a cache to store recently categorized items
const categoryCache: Record<string, { category: string, timestamp: number }> = {};
const CACHE_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

// Keep track of in-progress categorizations to avoid duplicate calls
const pendingCategorizations = new Map<string, Promise<string>>();

export const categorizeItem = async (itemName: string): Promise<string> => {
  if (!itemName) return "Other";
  
  // Check cache first
  const normalizedItemName = itemName.trim().toLowerCase();
  const now = Date.now();
  
  // Return from cache if available and not expired
  if (categoryCache[normalizedItemName] && 
      now - categoryCache[normalizedItemName].timestamp < CACHE_EXPIRY) {
    console.log(`Using cached category for "${itemName}": ${categoryCache[normalizedItemName].category}`);
    return categoryCache[normalizedItemName].category;
  }
  
  // Check if this item is already being categorized
  if (pendingCategorizations.has(normalizedItemName)) {
    console.log(`Reusing in-progress categorization for "${itemName}"`);
    return pendingCategorizations.get(normalizedItemName)!;
  }
  
  // Create a new categorization promise
  const categorizationPromise = (async () => {
    try {
      // Get the user's session for authentication
      const { supabase } = await import('@/integrations/supabase/client');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn("User not authenticated, falling back to local categorization");
        const category = categorizeItemLocally(itemName);
        categoryCache[normalizedItemName] = { category, timestamp: now };
        return category;
      }
      
      try {
        // Call the Supabase Edge Function directly
        const { data, error } = await supabase.functions.invoke('categorize-grocery', {
          body: { itemName }
        });
        
        if (error) {
          console.error('Supabase function error:', error);
          throw new Error(`AI categorization failed: ${error.message}`);
        }
        
        if (!data.success || !data.category) {
          throw new Error("AI returned invalid response");
        }
        
        // Cache the result
        categoryCache[normalizedItemName] = { category: data.category, timestamp: now };
        return data.category;
      } catch (error) {
        console.error("Error in AI categorization:", error);
        const category = categorizeItemLocally(itemName);
        // Cache the result
        categoryCache[normalizedItemName] = { category, timestamp: now };
        return category;
      }
    } finally {
      // Remove from pending categorizations after a short delay
      setTimeout(() => {
        pendingCategorizations.delete(normalizedItemName);
      }, 1000);
    }
  })();
  
  // Store the promise so concurrent requests for the same item can reuse it
  pendingCategorizations.set(normalizedItemName, categorizationPromise);
  
  return categorizationPromise;
};

/**
 * Fallback function that categorizes a grocery item based on its name using keyword matching
 * @param itemName The name of the grocery item to categorize
 * @returns The category name
 */
export const categorizeItemLocally = (itemName: string): string => {
  if (!itemName) return "Other";
  
  itemName = itemName.toLowerCase();
  
  // Produce - English, Spanish, French, Italian, German
  if (/apple|banana|lettuce|tomato|onion|garlic|vegetable|fruit|potato|carrot|spinach|pepper|cucumber|herb|lemon|lime|avocado|manzana|plátano|lechuga|tomate|cebolla|ajo|verdura|fruta|patata|zanahoria|espinaca|pimiento|pepino|hierba|limón|lima|aguacate|pomme|banane|laitue|oignon|ail|légume|fruit|pomme de terre|carotte|épinard|poivre|concombre|herbe|citron|citron vert|avocat|mela|banana|lattuga|pomodoro|cipolla|aglio|verdura|frutta|patata|carota|spinaci|pepe|cetriolo|erba|limone|lime|avocado|apfel|banane|salat|tomate|zwiebel|knoblauch|gemüse|obst|kartoffel|karotte|spinat|pfeffer|gurke|kraut|zitrone|limette|avocado/.test(itemName)) {
    return "Produce";
  } 
  // Dairy - English, Spanish, French, Italian, German
  else if (/milk|cheese|yogurt|cream|butter|egg|leche|queso|yogur|crema|mantequilla|huevo|lait|fromage|yaourt|crème|beurre|œuf|latte|formaggio|yogurt|panna|burro|uovo|milch|käse|joghurt|sahne|butter|ei/.test(itemName)) {
    return "Dairy";
  } 
  // Meat - English, Spanish, French, Italian, German
  else if (/beef|chicken|pork|fish|steak|meat|bacon|sausage|turkey|carne de res|pollo|cerdo|pescado|bistec|carne|tocino|salchicha|pavo|bœuf|poulet|porc|poisson|steak|viande|bacon|saucisse|dinde|manzo|pollo|maiale|pesce|bistecca|carne|pancetta|salsiccia|tacchino|rindfleisch|huhn|schweinefleisch|fisch|steak|fleisch|speck|wurst|truthahn/.test(itemName)) {
    return "Meat";
  } 
  // Pantry - English, Spanish, French, Italian, German
  else if (/rice|pasta|oil|vinegar|sauce|grain|bean|lentil|soy|peanut|arroz|aceite|vinagre|salsa|grano|frijol|lenteja|soja|maní|riz|huile|vinaigre|sauce|grain|haricot|lentille|soja|arachide|riso|olio|aceto|sugo|grano|fagiolo|lenticchia|soia|arachide|reis|öl|essig|soße|korn|bohne|linse|soja|erdnuss/.test(itemName)) {
    return "Pantry";
  } 
  // Spices - English, Spanish, French, Italian, German
  else if (/pepper|salt|cinnamon|paprika|oregano|thyme|basil|spice|vanilla|nutmeg|pimienta|sal|canela|pimentón|orégano|tomillo|albahaca|especia|vainilla|nuez moscada|poivre|sel|cannelle|paprika|origan|thym|basilic|épice|vanille|muscade|pepe|sale|cannella|paprica|origano|timo|basilico|spezia|vaniglia|noce moscata|pfeffer|salz|zimt|paprika|oregano|thymian|basilikum|gewürz|vanille|muskatnuss/.test(itemName)) {
    return "Spices";
  } 
  // Frozen - English, Spanish, French, Italian, German
  else if (/frozen|ice cream|pizza|freezer|congelado|helado|congelador|surgelé|crème glacée|congélateur|surgelato|gelato|congelatore|gefroren|eiscreme|gefrierschrank/.test(itemName)) {
    return "Frozen";
  } 
  // Baking - English, Spanish, French, Italian, German
  else if (/flour|sugar|baking powder|yeast|baking soda|chocolate|harina|azúcar|polvo de hornear|levadura|bicarbonato de sodio|chocolate|farine|sucre|levure chimique|levure|bicarbonate de soude|chocolat|farina|zucchero|lievito in polvere|lievito|bicarbonato di sodio|cioccolato|mehl|zucker|backpulver|hefe|natron|schokolade/.test(itemName)) {
    return "Baking";
  } 
  // Canned - English, Spanish, French, Italian, German
  else if (/can|canned|jar|tomato sauce|soup|beans|lata|enlatado|frasco|salsa de tomate|sopa|frijoles|boîte|conserve|pot|sauce tomate|soupe|haricots|lattina|in scatola|barattolo|salsa di pomodoro|zuppa|fagioli|dose|konserve|glas|tomatensauce|suppe|bohnen/.test(itemName)) {
    return "Canned";
  } 
  // Beverages - English, Spanish, French, Italian, German
  else if (/water|soda|juice|wine|beer|coffee|tea|drink|agua|refresco|jugo|vino|cerveza|café|té|bebida|eau|soda|jus|vin|bière|café|thé|boisson|acqua|soda|succo|vino|birra|caffè|tè|bevanda|wasser|limonade|saft|wein|bier|kaffee|tee|getränk/.test(itemName)) {
    return "Beverages";
  }
  
  return "Other";
}; 