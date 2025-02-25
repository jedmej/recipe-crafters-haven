export const FILTER_CATEGORIES = {
  mealType: {
    title: "Meal Type",
    options: ["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks", "Dessert", "Appetizer"],
    badgeClass: "bg-blue-100 text-blue-800"
  },
  dietaryRestrictions: {
    title: "Dietary Restrictions",
    options: ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", "Paleo", "Halal", "Kosher"],
    badgeClass: "bg-green-100 text-green-800"
  },
  difficultyLevel: {
    title: "Difficulty Level",
    options: ["Easy", "Medium", "Hard"],
    badgeClass: "bg-yellow-100 text-yellow-800"
  },
  cuisineType: {
    title: "Cuisine Type",
    options: ["Italian", "Asian", "Mexican", "Mediterranean", "American", "Indian", "Chinese", "Thai", "Middle Eastern", "Japanese", "French", "Other"],
    badgeClass: "bg-purple-100 text-purple-800"
  },
  cookingMethod: {
    title: "Cooking Method",
    options: ["Oven-baked", "Stovetop", "Air Fryer", "Slow Cooker", "Instant Pot", "Grill", "Sous-vide", "Microwave", "Other"],
    badgeClass: "bg-red-100 text-red-800"
  }
};

export const DEFAULT_RECIPE_FORM_DATA = {
  title: "",
  description: "",
  ingredients: [""],
  instructions: [""],
  image_url: "",
  source_url: "",
  prep_time: 0,
  cook_time: 0,
  estimated_calories: 0,
  servings: 1,
  language: "en",
  categories: {
    meal_type: "",
    dietary_restrictions: "",
    difficulty_level: "",
    cuisine_type: "",
    cooking_method: ""
  }
};

export const formatTime = (minutes: number): string => 
  minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;

export const formatCalories = (cal: number): string => `${cal} cal`;

export const DEFAULT_COOK_TIME_RANGE = [0, 120]; // 0 to 120 minutes
export const DEFAULT_CALORIES_RANGE = [0, 1000]; // 0 to 1000 calories 