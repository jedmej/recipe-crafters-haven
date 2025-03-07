/**
 * Categorizes a grocery item based on its name using keyword matching
 * @param itemName The name of the grocery item to categorize
 * @returns The category name
 */
export const categorizeItem = (itemName: string): string => {
  if (!itemName) return "Other";
  
  itemName = itemName.toLowerCase();
  
  if (/apple|banana|lettuce|tomato|onion|garlic|vegetable|fruit|potato|carrot|spinach|pepper|cucumber|herb|lemon|lime|avocado/.test(itemName)) {
    return "Produce";
  } else if (/milk|cheese|yogurt|cream|butter|egg/.test(itemName)) {
    return "Dairy";
  } else if (/beef|chicken|pork|fish|steak|meat|bacon|sausage|turkey/.test(itemName)) {
    return "Meat";
  } else if (/rice|pasta|oil|vinegar|sauce|grain|bean|lentil|soy|peanut/.test(itemName)) {
    return "Pantry";
  } else if (/pepper|salt|cinnamon|paprika|oregano|thyme|basil|spice|vanilla|nutmeg/.test(itemName)) {
    return "Spices";
  } else if (/frozen|ice cream|pizza|freezer/.test(itemName)) {
    return "Frozen";
  } else if (/flour|sugar|baking powder|yeast|baking soda|chocolate/.test(itemName)) {
    return "Baking";
  } else if (/can|canned|jar|tomato sauce|soup|beans/.test(itemName)) {
    return "Canned";
  } else if (/water|soda|juice|wine|beer|coffee|tea|drink/.test(itemName)) {
    return "Beverages";
  }
  
  return "Other";
}; 