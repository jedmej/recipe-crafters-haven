// Script to test fetching user preferences from Supabase
import { supabase } from "@/integrations/supabase/client";

// Function to test if we can fetch the user preferences
export async function testFetchUserPreferences() {
  try {
    // Get the current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting current user:", userError);
      return { success: false, error: userError };
    }
    
    if (!userData.user) {
      console.log("No user is currently signed in");
      return { success: false, error: "No user is signed in" };
    }
    
    // Try to fetch the user preferences
    const { data, error } = await supabase
      .from('profiles')
      .select('language, measurement_system')
      .eq('id', userData.user.id)
      .single();
    
    if (error) {
      console.error("Error fetching preferences:", error);
      return { success: false, error };
    }
    
    console.log("Successfully fetched user preferences:", data);
    return { success: true, data };
  } catch (error) {
    console.error("Unexpected error in testFetchUserPreferences:", error);
    return { success: false, error };
  }
}

// Run the test if this file is executed directly
if (typeof window !== 'undefined') {
  // Only run in browser environment
  console.log("Running user preferences test...");
  testFetchUserPreferences().then(result => {
    console.log("Test complete:", result);
  });
} 