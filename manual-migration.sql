-- Migration to add missing columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en' CHECK (language IN ('en', 'es', 'fr', 'it', 'de', 'pl'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS measurement_system TEXT DEFAULT 'metric' CHECK (measurement_system IN ('metric', 'imperial'));

-- Update existing profiles with default values
UPDATE profiles 
SET language = 'en', measurement_system = 'metric'
WHERE language IS NULL OR measurement_system IS NULL;

-- Verify columns exist
SELECT 
    column_name, 
    data_type, 
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_name = 'profiles' 
    AND column_name IN ('language', 'measurement_system'); 