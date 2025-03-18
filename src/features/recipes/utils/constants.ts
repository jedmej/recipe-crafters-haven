export const FILTER_CATEGORIES = {
  mealType: {
    title: "Meal Type",
    options: ["Breakfast", "Brunch", "Lunch", "Dinner", "Snacks", "Dessert", "Appetizer", "Soup", "Side Dish"],
    badgeClass: "bg-blue-100 text-blue-800"
  },
  healthFocus: {
    title: "Health Focus",
    options: ["Low-Calorie", "High-Protein", "Low-Carb", "Heart-Healthy", "Weight Loss", "Balanced", "Superfood", "Clean Eating", "Mediterranean Diet", "Other"],
    badgeClass: "bg-emerald-100 text-emerald-800"
  },
  dietaryRestrictions: {
    title: "Dietary Restrictions",
    options: ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Keto", "Paleo", "Halal", "Kosher", "Nut-free", "Low-Sodium", "None"],
    badgeClass: "bg-green-100 text-green-800"
  },
  difficultyLevel: {
    title: "Difficulty Level",
    options: ["Easy", "Medium", "Hard", "Expert"],
    badgeClass: "bg-yellow-100 text-yellow-800"
  },
  cuisineType: {
    title: "Cuisine Type",
    options: ["Italian", "Mexican", "Chinese", "Japanese", "Thai", "French", "Middle Eastern", "Indian", "American", "Mediterranean", "Caribbean", "Greek", "Spanish", "Other"],
    badgeClass: "bg-purple-100 text-purple-800"
  },
  cookingMethod: {
    title: "Cooking Method",
    options: ["Baking", "Frying", "Grilling", "Roasting", "Steaming", "Boiling", "Slow Cooking", "Sous Vide", "Other"],
    badgeClass: "bg-red-100 text-red-800"
  },
  occasion: {
    title: "Occasion",
    options: ["Everyday", "Party", "Holiday", "Birthday"],
    badgeClass: "bg-pink-100 text-pink-800"
  },
  courseCategory: {
    title: "Course Category",
    options: ["Soup", "Salad", "Main Course", "Side Dish", "Dessert", "Beverage"],
    badgeClass: "bg-indigo-100 text-indigo-800"
  },
  tasteProfile: {
    title: "Taste Profile",
    options: ["Sweet", "Savory", "Spicy", "Sour", "Salty", "Bitter", "Umami", "Tangy", "Mild"],
    badgeClass: "bg-orange-100 text-orange-800"
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
    cooking_method: "",
    occasion: "",
    course_category: "",
    taste_profile: ""
  }
};

export const formatTime = (minutes: number): string => 
  minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}`;

export const formatCalories = (cal: number): string => `${cal} cal`;

export const DEFAULT_COOK_TIME_RANGE = [0, 120]; // 0 to 120 minutes
export const DEFAULT_CALORIES_RANGE = [0, 1000]; // 0 to 1000 calories 