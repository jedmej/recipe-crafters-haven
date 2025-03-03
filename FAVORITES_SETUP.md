# Setting Up the Favorites Feature

This document provides instructions on how to set up the favorites feature in Recipe Crafters Haven.

## Overview

The favorites feature allows users to mark recipes as favorites and have them pinned to the top of the recipes list. The feature requires a `user_favorites` table in your Supabase database.

## Option 1: Apply the Migration Using the Supabase Dashboard

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Copy and paste the contents of `supabase/migrations/20240501000000_create_user_favorites.sql`
6. Run the query

## Option 2: Apply the Migration Using the Script

We've provided a script to apply the migration automatically:

1. Make sure you have the following environment variables in your `.env` file:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Install the required dependencies:
   ```bash
   npm install dotenv @supabase/supabase-js
   ```

3. Run the migration script:
   ```bash
   node scripts/apply-migration.js
   ```

## Verifying the Setup

To verify that the favorites feature is set up correctly:

1. Restart your application
2. Navigate to the recipes page
3. Try to favorite a recipe by clicking the heart icon
4. If the recipe is successfully favorited, the heart icon should turn red and the recipe should move to the top of the list

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Verify that the `user_favorites` table exists in your Supabase database
3. Make sure your Supabase RLS policies are set up correctly
4. Check that your user has the necessary permissions to access the `user_favorites` table 