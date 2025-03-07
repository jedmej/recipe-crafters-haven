-- Migration to add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'it', 'de', 'pl', 'ru', 'uk'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS measurement_system TEXT DEFAULT 'metric' CHECK (measurement_system IN ('metric', 'imperial'));

-- Update existing profiles with default values
UPDATE profiles 
SET language = 'en', measurement_system = 'metric'
WHERE language IS NULL OR measurement_system IS NULL;

COMMENT ON COLUMN profiles.language IS 'User preferred language for the application';
COMMENT ON COLUMN profiles.measurement_system IS 'User preferred measurement system (metric or imperial)'; 