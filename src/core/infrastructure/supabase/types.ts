/**
 * Supabase Database Types
 * Type-safe database schema definitions
 * 
 * To regenerate from live schema:
 * npx supabase gen types typescript --project-id jufwllhkgtvovyazgxld > src/core/infrastructure/supabase/types.ts
 */

export interface Database {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          username: string;
          email: string;
          role: 'homeowner' | 'provider' | 'admin';
          provider_type_id: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          email_verified: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          role?: 'homeowner' | 'provider' | 'admin';
          provider_type_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          role?: 'homeowner' | 'provider' | 'admin';
          provider_type_id?: string | null;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          is_active?: boolean;
          email_verified?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      provider_types: {
        Row: {
          id: string;
          type_name: string;
          display_name: string;
          description: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          type_name: string;
          display_name: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          type_name?: string;
          display_name?: string;
          description?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          created_by?: string | null;
        };
      };
    };
    Views: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          role: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          is_active: boolean;
          email_verified: boolean;
          created_at: string;
          provider_type: string | null;
          provider_type_display: string | null;
        };
      };
    };
    Functions: {
      is_username_available: {
        Args: { check_username: string };
        Returns: boolean;
      };
    };
    Enums: {
      user_role: 'homeowner' | 'provider' | 'admin';
    };
  };
}
