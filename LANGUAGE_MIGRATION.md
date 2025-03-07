# Language Support Migration

This document provides instructions for fixing the issue with Russian and Ukrainian language support in the recipe generation system.

## Issue

The database has a constraint on the `language` column in the `profiles` table that only allows certain languages ('en', 'es', 'fr', 'it', 'de', 'pl'). However, the application UI has been updated to support Russian ('ru') and Ukrainian ('uk') languages, but the database constraint prevents these languages from being saved.

Additionally, when trying to update the constraint, we encountered an error: "profiles_language_check" of relation "profiles" is violated by some row". This indicates that there are existing rows in the profiles table with language values that don't match the constraint we're trying to add.

## Solution

We need to update the database constraint to include Russian and Ukrainian languages, but first we need to handle any existing rows with invalid language values.

### Migration Files

Two migration files have been created:

1. `supabase/migrations/20240619000000_update_language_constraint.sql` - This file:
   - Identifies any rows with language values outside the allowed set
   - Updates any rows with invalid language values to 'en'
   - Drops the existing constraint and adds a new one that includes Russian and Ukrainian
2. The original migration file `supabase/migrations/20240618000000_add_missing_profile_columns.sql` has been updated to include Russian and Ukrainian for consistency.

### Applying the Migration

To apply the migration to the production database, you can use one of the following methods:

#### Method 1: Using Supabase CLI

```bash
# Make sure you're connected to the production project
supabase link --project-ref <your-project-ref>

# Apply the migration
supabase migration up
```

#### Method 2: Using the Supabase Dashboard

1. Go to the Supabase Dashboard
2. Select your project
3. Go to the SQL Editor
4. Create a new query
5. Paste the contents of `supabase/migrations/20240619000000_update_language_constraint.sql`
6. Run the query

#### Method 3: Using psql

If you have direct access to the database:

```bash
psql -h <database-host> -U <database-user> -d <database-name> -f supabase/migrations/20240619000000_update_language_constraint.sql
```

## Verification

After applying the migration, you can verify that the constraint has been updated by running the following SQL query:

```sql
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
```

The result should show that the constraint now includes 'ru' and 'uk'. 