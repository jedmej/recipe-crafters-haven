import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./baseService";
import { User } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  measurement_system: 'metric' | 'imperial';
  ui_language: string;
  recipe_language: string;
  created_at?: string;
  updated_at?: string;
}

export class ProfileService extends BaseService {
  /**
   * Get user profile by user ID
   */
  async getProfile(userId?: string): Promise<UserProfile> {
    try {
      // If userId is not provided, get the current user's ID
      const user = userId ? { id: userId } : await this.getCurrentUser();
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        return this.handleError(error, "Failed to fetch profile");
      }
      
      return data as UserProfile;
    } catch (error) {
      return this.handleError(error, "Failed to fetch profile");
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(profileData: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const user = await this.getCurrentUser();
      
      const updates = {
        ...profileData,
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        return this.handleError(error, "Failed to update profile");
      }
      
      return data as UserProfile;
    } catch (error) {
      return this.handleError(error, "Failed to update profile");
    }
  }

  /**
   * Get user profile and user data together
   */
  async getUserAndProfile(): Promise<{ user: User; profile: UserProfile }> {
    try {
      const user = await this.getCurrentUser();
      
      if (!user) {
        throw new Error("No user found");
      }
      
      const profile = await this.getProfile(user.id);
      
      return { user, profile };
    } catch (error) {
      return this.handleError(error, "Failed to fetch user and profile");
    }
  }
} 