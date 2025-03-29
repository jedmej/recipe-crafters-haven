import { supabase } from "@/integrations/supabase/client";
import { BaseService } from "./baseService";
import { AuthError, Session, User } from "@supabase/supabase-js";

export class AuthService extends BaseService {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) {
        return this.handleError(error, "Failed to sign up");
      }
      
      return true;
    } catch (error) {
      return this.handleError(error, "Failed to sign up");
    }
  }

  /**
   * Sign in an existing user
   */
  async signIn(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        return this.handleError(error, "Failed to sign in");
      }
      
      return true;
    } catch (error) {
      return this.handleError(error, "Failed to sign in");
    }
  }

  /**
   * Sign out the current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        return this.handleError(error, "Failed to sign out");
      }
      
      return true;
    } catch (error) {
      return this.handleError(error, "Failed to sign out");
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        console.error("Error getting user:", error);
        return null;
      }
      
      return user;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("Error getting session:", error);
        return null;
      }
      
      return session;
    } catch (error) {
      console.error("Error getting session:", error);
      return null;
    }
  }

  /**
   * Set up an auth state change listener
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(callback);
    return subscription;
  }

  /**
   * Reset password
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      
      if (error) {
        return this.handleError(error, "Failed to reset password");
      }
      
      return true;
    } catch (error) {
      return this.handleError(error, "Failed to reset password");
    }
  }
} 