import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Force HTTPS for Supabase URL to prevent Mixed Content errors
const secureSupabaseUrl = supabaseUrl?.replace(/^http:/, 'https:');

// Create a dummy client if environment variables are not set (for development)
export const supabase = secureSupabaseUrl && supabaseAnonKey 
  ? createClient(secureSupabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// Storage bucket names
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  EMPLOYEE_DOCUMENTS: 'employee-documents',
  EQUIPMENT_DOCUMENTS: 'equipment-documents',
  GENERAL: 'general',
} as const;

export type StorageBucket = typeof STORAGE_BUCKETS[keyof typeof STORAGE_BUCKETS];
