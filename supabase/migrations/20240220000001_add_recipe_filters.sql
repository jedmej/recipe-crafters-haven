-- First, create the enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE meal_type AS ENUM (
        'Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Appetizer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE dietary_restriction AS ENUM (
        'Vegetarian', 'Vegan', 'Gluten-free', 'Dairy-free', 'Keto', 'Paleo', 'Halal', 'Kosher'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cuisine_type AS ENUM (
        'Italian', 'Asian', 'Mexican', 'Mediterranean', 'American', 'Indian', 
        'Chinese', 'Thai', 'Middle Eastern', 'Japanese', 'French', 'Other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE cooking_method AS ENUM (
        'Oven-baked', 'Stovetop', 'Air Fryer', 'Slow Cooker', 
        'Instant Pot', 'Grill', 'Sous-vide', 'Microwave'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Now add the columns to the recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS cooking_time_min integer,
ADD COLUMN IF NOT EXISTS cooking_time_max integer;

-- Add check constraints for valid values
ALTER TABLE recipes
ADD CONSTRAINT valid_cooking_time_min CHECK (cooking_time_min >= 5),
ADD CONSTRAINT valid_cooking_time_max CHECK (cooking_time_max <= 720),
ADD CONSTRAINT valid_cooking_time_range CHECK (cooking_time_max >= cooking_time_min); 