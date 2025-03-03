// This script applies the user_favorites migration to your Supabase instance
// Run with: node scripts/apply-migration.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file if available
require('dotenv').config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ADMIN_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase URL or service role key not found in environment variables.');
  console.error('Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    console.log('Applying user_favorites migration...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../supabase/migrations/20240501000000_create_user_favorites.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL using Supabase's REST API
    const { error } = await supabase.rpc('exec_sql', { query: migrationSql });
    
    if (error) {
      console.error('Error applying migration:', error);
      process.exit(1);
    }
    
    console.log('Migration applied successfully!');
    console.log('The user_favorites table has been created in your Supabase database.');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

applyMigration(); 