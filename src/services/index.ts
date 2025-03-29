export * from './baseService';
export * from './recipeService';
export * from './groceryService';
export * from './aiService';
export * from './storageService';
export * from './authService';
export * from './profileService';
export * from './avatarService';

// Create service instances for convenience
import { RecipeService } from './recipeService';
import { GroceryService } from './groceryService';
import { AIService } from './aiService';
import { StorageService } from './storageService';
import { AuthService } from './authService';
import { ProfileService } from './profileService';
// We import the existing avatarService instance from its file
import { avatarService } from './avatarService';

// Export singleton instances
export const recipeService = new RecipeService();
export const groceryService = new GroceryService();
export const aiService = new AIService();
export const storageService = new StorageService();
export const authService = new AuthService();
export const profileService = new ProfileService(); 