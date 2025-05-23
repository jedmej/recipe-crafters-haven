export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      grocery_lists: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          items: Json
          recipe_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          items?: Json
          recipe_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          items?: Json
          recipe_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grocery_lists_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grocery_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          measurement_system: string | null
          recipe_language: string | null
          ui_language: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          measurement_system?: string | null
          recipe_language?: string | null
          ui_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          measurement_system?: string | null
          recipe_language?: string | null
          ui_language?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          categories: Json | null
          cook_time: number | null
          cooking_time_max: number | null
          cooking_time_min: number | null
          created_at: string
          description: string | null
          estimated_calories: number | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          language: string
          portion_description: string
          portion_size: number
          prep_time: number | null
          servings: number
          source_url: string | null
          suggested_portions: number | null
          title: string
          user_id: string
        }
        Insert: {
          categories?: Json | null
          cook_time?: number | null
          cooking_time_max?: number | null
          cooking_time_min?: number | null
          created_at?: string
          description?: string | null
          estimated_calories?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          language?: string
          portion_description?: string
          portion_size?: number
          prep_time?: number | null
          servings?: number
          source_url?: string | null
          suggested_portions?: number | null
          title: string
          user_id: string
        }
        Update: {
          categories?: Json | null
          cook_time?: number | null
          cooking_time_max?: number | null
          cooking_time_min?: number | null
          created_at?: string
          description?: string | null
          estimated_calories?: number | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          language?: string
          portion_description?: string
          portion_size?: number
          prep_time?: number | null
          servings?: number
          source_url?: string | null
          suggested_portions?: number | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_recipes_by_categories: {
        Args: { search_categories: string[] }
        Returns: {
          categories: Json | null
          cook_time: number | null
          cooking_time_max: number | null
          cooking_time_min: number | null
          created_at: string
          description: string | null
          estimated_calories: number | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          language: string
          portion_description: string
          portion_size: number
          prep_time: number | null
          servings: number
          source_url: string | null
          suggested_portions: number | null
          title: string
          user_id: string
        }[]
      }
    }
    Enums: {
      cooking_method:
        | "Oven-baked"
        | "Stovetop"
        | "Air Fryer"
        | "Slow Cooker"
        | "Instant Pot"
        | "Grill"
        | "Sous-vide"
        | "Microwave"
      cuisine_type:
        | "Italian"
        | "Asian"
        | "Mexican"
        | "Mediterranean"
        | "American"
        | "Indian"
        | "Chinese"
        | "Thai"
        | "Middle Eastern"
        | "Japanese"
        | "French"
        | "Other"
      dietary_restriction:
        | "Vegetarian"
        | "Vegan"
        | "Gluten-free"
        | "Dairy-free"
        | "Keto"
        | "Paleo"
        | "Halal"
        | "Kosher"
      meal_type:
        | "Breakfast"
        | "Brunch"
        | "Lunch"
        | "Dinner"
        | "Snacks"
        | "Dessert"
        | "Appetizer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      cooking_method: [
        "Oven-baked",
        "Stovetop",
        "Air Fryer",
        "Slow Cooker",
        "Instant Pot",
        "Grill",
        "Sous-vide",
        "Microwave",
      ],
      cuisine_type: [
        "Italian",
        "Asian",
        "Mexican",
        "Mediterranean",
        "American",
        "Indian",
        "Chinese",
        "Thai",
        "Middle Eastern",
        "Japanese",
        "French",
        "Other",
      ],
      dietary_restriction: [
        "Vegetarian",
        "Vegan",
        "Gluten-free",
        "Dairy-free",
        "Keto",
        "Paleo",
        "Halal",
        "Kosher",
      ],
      meal_type: [
        "Breakfast",
        "Brunch",
        "Lunch",
        "Dinner",
        "Snacks",
        "Dessert",
        "Appetizer",
      ],
    },
  },
} as const
