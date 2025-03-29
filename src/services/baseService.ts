import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";

/**
 * Base service class with common functionality for all services
 */
export class BaseService {
  /**
   * Get the current user from the auth session
   */
  protected async getCurrentUser(): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error("User not authenticated");
    }
    return user;
  }

  /**
   * Get the current session
   */
  protected async getSession(): Promise<Session> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) {
      throw new Error("No active session");
    }
    return session;
  }

  /**
   * Handle Supabase errors consistently
   */
  protected handleError(error: any, customMessage?: string): never {
    console.error(customMessage || "Service operation failed", error);
    throw error;
  }
} 