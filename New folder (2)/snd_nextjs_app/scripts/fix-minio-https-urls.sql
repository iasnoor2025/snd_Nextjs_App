-- Fix MinIO HTTPS URLs Migration Script
-- This script updates all HTTP MinIO URLs to HTTPS to fix mixed content errors

-- Update employee documents table
UPDATE employee_documents 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';

-- Update equipment documents table (if exists)
UPDATE equipment_documents 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';

-- Update media table (if exists)
UPDATE media 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';

-- Update any other tables that might contain MinIO URLs
-- Add more UPDATE statements here if you have other tables with file URLs

-- Show affected records count
SELECT 
    'employee_documents' as table_name,
    COUNT(*) as updated_records
FROM employee_documents 
WHERE file_path LIKE 'https://minio.snd-ksa.online%'

UNION ALL

SELECT 
    'equipment_documents' as table_name,
    COUNT(*) as updated_records
FROM equipment_documents 
WHERE file_path LIKE 'https://minio.snd-ksa.online%'

UNION ALL

SELECT 
    'media' as table_name,
    COUNT(*) as updated_records
FROM media 
WHERE file_path LIKE 'https://minio.snd-ksa.online%';
