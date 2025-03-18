-- Add UI language column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ui_language TEXT DEFAULT 'en' CHECK (ui_language IN ('en', 'es', 'fr', 'it', 'de', 'pl', 'ru', 'uk'));

-- Rename existing language column to recipe_language for clarity
ALTER TABLE profiles RENAME COLUMN language TO recipe_language;

-- Update existing profiles to use the same language for UI as their recipe language
UPDATE profiles 
SET ui_language = recipe_language
WHERE ui_language IS NULL;

-- Add comments for clarity
COMMENT ON COLUMN profiles.ui_language IS 'User preferred language for the application interface';
COMMENT ON COLUMN profiles.recipe_language IS 'User preferred language for recipe generation';

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'profiles' 
    AND column_name IN ('ui_language', 'recipe_language', 'measurement_system'); 