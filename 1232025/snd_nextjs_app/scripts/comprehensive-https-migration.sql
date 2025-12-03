-- Comprehensive HTTPS Migration Script
-- This script updates ALL HTTP URLs to HTTPS across all tables
-- Run this in your production database to fix mixed content errors

-- ============================================
-- EMPLOYEE DOCUMENTS TABLE
-- ============================================
UPDATE employee_documents 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';

UPDATE employee_documents 
SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';

-- ============================================
-- EQUIPMENT DOCUMENTS TABLE (if exists)
-- ============================================
UPDATE equipment_documents 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';

UPDATE equipment_documents 
SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';

-- ============================================
-- MEDIA TABLE (if exists)
-- ============================================
UPDATE media 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';

UPDATE media 
SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';

-- ============================================
-- ANY OTHER TABLES WITH FILE_URLS (if they exist)
-- ============================================
-- Add more UPDATE statements here if you have other tables with file URLs
-- Example:
-- UPDATE table_name 
-- SET file_url = REPLACE(file_url, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
-- WHERE file_url LIKE 'http://minio.snd-ksa.online%';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Show count of updated records
SELECT 
    'employee_documents' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as https_minio_records,
    SUM(CASE WHEN file_path LIKE 'http://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as http_minio_records,
    SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as https_supabase_records,
    SUM(CASE WHEN file_path LIKE 'http://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as http_supabase_records
FROM employee_documents 

UNION ALL

SELECT 
    'equipment_documents' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as https_minio_records,
    SUM(CASE WHEN file_path LIKE 'http://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as http_minio_records,
    SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as https_supabase_records,
    SUM(CASE WHEN file_path LIKE 'http://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as http_supabase_records
FROM equipment_documents 

UNION ALL

SELECT 
    'media' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN file_path LIKE 'https://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as https_minio_records,
    SUM(CASE WHEN file_path LIKE 'http://minio.snd-ksa.online%' THEN 1 ELSE 0 END) as http_minio_records,
    SUM(CASE WHEN file_path LIKE 'https://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as https_supabase_records,
    SUM(CASE WHEN file_path LIKE 'http://supabasekong.snd-ksa.online%' THEN 1 ELSE 0 END) as http_supabase_records
FROM media;

-- ============================================
-- FINAL CHECK - Show any remaining HTTP URLs
-- ============================================
SELECT 'REMAINING HTTP URLs FOUND:' as status;

SELECT 'employee_documents' as table_name, id, file_path
FROM employee_documents 
WHERE file_path LIKE 'http://%'
LIMIT 10;

SELECT 'equipment_documents' as table_name, id, file_path
FROM equipment_documents 
WHERE file_path LIKE 'http://%'
LIMIT 10;

SELECT 'media' as table_name, id, file_path
FROM media 
WHERE file_path LIKE 'http://%'
LIMIT 10;
