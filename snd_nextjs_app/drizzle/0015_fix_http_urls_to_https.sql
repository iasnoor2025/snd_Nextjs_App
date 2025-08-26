-- Migration: Fix HTTP URLs to HTTPS to prevent Mixed Content errors
-- This updates all existing document URLs from HTTP to HTTPS

-- Update employee documents
UPDATE employee_documents 
SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';

-- Update equipment documents (media table)
UPDATE media 
SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';

-- Update company documents if they exist
-- UPDATE company_documents 
-- SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
-- WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';
