import { RecipeValidation } from './types';

export function cleanJsonResponse(text: string): string {
  try {
    // Remove all variations of markdown code fences and language identifiers
    let cleanedText = text
      .replace(/^```(?:json|JSON)?\n/m, '')  // Remove opening code fence with optional 'json' identifier
      .replace(/\n```$/m, '')                // Remove closing code fence
      .replace(/^```.*\n|\n```$/gm, '')      // Remove any other code fences
      .trim();                               // Remove any extra whitespace
    
    // If the text still looks like it might contain markdown, try to extract JSON
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanedText = jsonMatch[0];
    }
    
    // Parse to validate and get a clean object
    let parsed;
    try {
      parsed = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Failed to parse text:', cleanedText);
      throw new Error(`Invalid JSON format: ${parseError.message}`);
    }
    
    // Ensure all required fields are present
    const requiredFields = [
      'title', 'description', 'ingredients', 'instructions',
      'prep_time', 'cook_time', 'estimated_calories',
      'suggested_portions', 'portion_description'
    ];
    
    // Map cooking_time_min/max to cook_time if needed
    if (parsed.cooking_time_min && !parsed.cook_time) {
      parsed.cook_time = parsed.cooking_time_min;
    }

    const missingFields = requiredFields.filter(field => !(field in parsed));
    if (missingFields.length > 0) {
      // Add portion_description if missing
      if (missingFields.includes('portion_description')) {
        parsed.portion_description = `Serves ${parsed.suggested_portions} people`;
        missingFields.splice(missingFields.indexOf('portion_description'), 1);
      }
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
    }

    // Clean up any extra fields and ensure numbers are integers
    const cleanedData = requiredFields.reduce((acc, field) => {
      let value = parsed[field];
      
      // Convert any number-like strings to numbers
      if (['prep_time', 'cook_time', 'estimated_calories', 'suggested_portions'].includes(field)) {
        if (typeof value === 'string' && value.includes('-')) {
          value = parseInt(value.split('-')[0]);
        }
        value = Math.floor(Number(value));
        if (isNaN(value)) {
          throw new Error(`${field} must be a valid number`);
        }
      }
      
      acc[field] = value;
      return acc;
    }, {} as Record<string, any>);

    // Validate arrays
    if (!Array.isArray(cleanedData.ingredients)) throw new Error('ingredients must be an array');
    if (!Array.isArray(cleanedData.instructions)) throw new Error('instructions must be an array');
    
    // Validate numbers
    if (typeof cleanedData.prep_time !== 'number') throw new Error('prep_time must be a number');
    if (typeof cleanedData.cook_time !== 'number') throw new Error('cook_time must be a number');
    if (typeof cleanedData.estimated_calories !== 'number') throw new Error('estimated_calories must be a number');
    if (typeof cleanedData.suggested_portions !== 'number') throw new Error('suggested_portions must be a number');
    if (typeof cleanedData.portion_description !== 'string') throw new Error('portion_description must be a string');

    return JSON.stringify(cleanedData);
  } catch (e) {
    console.error('Failed to process JSON:', e);
    throw new Error(`Failed to parse recipe data: ${e.message}`);
  }
}

export function validateRecipeData(recipeData: RecipeValidation) {
  const requiredFields = [
    'title', 'description', 'ingredients', 'instructions',
    'prep_time', 'cook_time', 'estimated_calories',
    'suggested_portions', 'portion_description'
  ] as const;

  for (const field of requiredFields) {
    if (recipeData[field] === undefined) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!Array.isArray(recipeData.ingredients)) throw new Error('ingredients must be an array');
  if (!Array.isArray(recipeData.instructions)) throw new Error('instructions must be an array');
  if (typeof recipeData.prep_time !== 'number') throw new Error('prep_time must be a number');
  if (typeof recipeData.cook_time !== 'number') throw new Error('cook_time must be a number');
  if (typeof recipeData.estimated_calories !== 'number') throw new Error('estimated_calories must be a number');
  if (typeof recipeData.suggested_portions !== 'number') throw new Error('suggested_portions must be a number');
  if (typeof recipeData.portion_description !== 'string') throw new Error('portion_description must be a string');
}
