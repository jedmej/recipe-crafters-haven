-- Migration to update language constraint in profiles table to include Russian and Ukrainian

-- First, identify any rows with language values outside the allowed set
SELECT id, language FROM profiles 
WHERE language NOT IN ('en', 'es', 'fr', 'it', 'de', 'pl', 'ru', 'uk');

-- Update any rows with invalid language values to 'en'
UPDATE profiles 
SET language = 'en' 
WHERE language NOT IN ('en', 'es', 'fr', 'it', 'de', 'pl', 'ru', 'uk');

-- Now drop and recreate the constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_language_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_language_check CHECK (language IN ('en', 'es', 'fr', 'it', 'de', 'pl', 'ru', 'uk'));

-- Verify the constraint
SELECT 
    tc.constraint_name, 
    cc.check_clause
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.check_constraints cc
ON 
    tc.constraint_name = cc.constraint_name
WHERE 
    tc.table_name = 'profiles' 
    AND tc.constraint_type = 'CHECK'
    AND cc.check_clause LIKE '%language%'; 