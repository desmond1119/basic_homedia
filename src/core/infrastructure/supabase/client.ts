/**
 * Supabase Client Configuration
 * Singleton instance for database, auth, storage, and realtime
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/core/config/env';
import { Database } from '@/types/database.types';

class SupabaseClientSingleton {
  private static instance: SupabaseClient<Database> | null = null;

  private constructor() {}

  public static getInstance(): SupabaseClient<Database> {
    if (!SupabaseClientSingleton.instance) {
      SupabaseClientSingleton.instance = createClient<Database>(
        env.supabase.url,
        env.supabase.anonKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
          },
        }
      );
    }
    return SupabaseClientSingleton.instance;
  }
}

export const supabase = SupabaseClientSingleton.getInstance();
