import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Debug logging
console.log('🔍 Supabase Client Debug:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length || 0,
  keyLength: supabaseAnonKey?.length || 0,
  urlStart: supabaseUrl?.substring(0, 30) || 'none',
  keyStart: supabaseAnonKey?.substring(0, 20) || 'none'
});

// Create a dummy client if environment variables are not set (for development)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
