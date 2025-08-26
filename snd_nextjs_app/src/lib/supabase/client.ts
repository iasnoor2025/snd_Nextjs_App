import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Force HTTPS for Supabase URL to prevent Mixed Content errors
// This ensures it works in both development and production
const secureSupabaseUrl = supabaseUrl?.replace(/^http:/, 'https:');

// Additional safety: if the URL still contains HTTP, force HTTPS
const finalSupabaseUrl = secureSupabaseUrl?.includes('http://') 
  ? secureSupabaseUrl.replace(/^http:/, 'https:') 
  : secureSupabaseUrl;

console.log('Supabase URL (original):', supabaseUrl);
console.log('Supabase URL (secure):', finalSupabaseUrl);

// Create a dummy client if environment variables are not set (for development)
export const supabase = finalSupabaseUrl && supabaseAnonKey 
  ? createClient(finalSupabaseUrl, supabaseAnonKey, {
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
