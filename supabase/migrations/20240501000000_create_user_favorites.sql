-- Create user_favorites table
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipe_id UUID NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  
  -- Add a unique constraint to prevent duplicate favorites
  UNIQUE(user_id, recipe_id)
);

-- Add RLS policies
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own favorites
CREATE POLICY "Users can view their own favorites" 
  ON public.user_favorites 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to insert their own favorites
CREATE POLICY "Users can insert their own favorites" 
  ON public.user_favorites 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own favorites
CREATE POLICY "Users can delete their own favorites" 
  ON public.user_favorites 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx ON public.user_favorites (user_id);
CREATE INDEX IF NOT EXISTS user_favorites_recipe_id_idx ON public.user_favorites (recipe_id); 