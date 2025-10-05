/**
 * Environment Configuration
 * Centralized environment variable access with type safety
 */

interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  isDevelopment: boolean;
  isProduction: boolean;
}

function getEnvVar(key: string): string {
  const value = import.meta.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env: EnvConfig = {
  supabase: {
    url: getEnvVar('VITE_SUPABASE_URL'),
    anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
  },
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
