-- Add categories column to recipes table
ALTER TABLE recipes DROP COLUMN IF EXISTS categories;
ALTER TABLE recipes ADD COLUMN categories JSONB DEFAULT '{
  "meal_type": null,
  "dietary_restrictions": null,
  "difficulty_level": null,
  "cuisine_type": null,
  "cooking_method": null
}'::jsonb;

-- Create an index on the categories column for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_categories ON recipes USING GIN (categories);

-- Add RLS policies for categories
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own recipes categories" 
ON recipes FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes categories" 
ON recipes FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Function to search recipes by category
CREATE OR REPLACE FUNCTION search_recipes_by_category(category_type text, category_value text)
RETURNS SETOF recipes
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM recipes
  WHERE categories->category_type = to_jsonb(category_value::text);
$$; 