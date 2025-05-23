
// Define types for grocery items and lists
export interface GroceryItem {
  name: string;
  checked: boolean;
  category?: string;
  [key: string]: any; // Allow for additional properties to satisfy Json compatibility
}

export interface GroceryList {
  id: string;
  title: string;
  user_id: string;
  items: GroceryItem[];
  recipe_id?: string;
  image_url?: string;
  created_at: string;
  recipe?: {
    id: string;
    title: string;
    image_url?: string;
  } | null;
}
