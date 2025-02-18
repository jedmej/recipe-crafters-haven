
export function cleanJsonResponse(text: string): string {
  const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim();
  }
  
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }
  
  return text.replace(/```/g, '').trim();
}

export function validateRecipeData(recipeData: any) {
  const requiredFields = [
    'title', 'description', 'ingredients', 'instructions',
    'prep_time', 'cook_time', 'estimated_calories',
    'suggested_portions', 'portion_description'
  ];

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
