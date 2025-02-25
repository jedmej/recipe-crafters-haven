// Copy and paste this code into your browser console after applying the SQL changes

(async function() {
  try {
    // Get the current user
    const { data: userData, error: userError } = await window.supabase.auth.getUser();
    
    if (userError) {
      console.error("Error getting current user:", userError);
      return;
    }
    
    if (!userData.user) {
      console.log("No user is currently signed in");
      return;
    }
    
    console.log("Current user:", userData.user.id);
    
    // Try to fetch the user preferences
    const { data, error } = await window.supabase
      .from('profiles')
      .select('language, measurement_system')
      .eq('id', userData.user.id)
      .single();
    
    if (error) {
      console.error("Error fetching preferences:", error);
      return;
    }
    
    console.log("Successfully fetched user preferences:", data);
    console.log("VERIFICATION PASSED: The issue has been fixed!");
  } catch (error) {
    console.error("Unexpected error:", error);
  }
})(); 