# MinIO Setup Guide

This guide explains how to set up MinIO for file storage in your Next.js application, replacing Supabase storage.

## Prerequisites

- MinIO server running (local or remote)
- MinIO access credentials
- Node.js environment with AWS SDK

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# MinIO Configuration
S3_ENDPOINT=http://localhost:9000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_minio_access_key
AWS_SECRET_ACCESS_KEY=your_minio_secret_key

# Optional: Custom bucket names (defaults will be used if not specified)
MINIO_DOCUMENTS_BUCKET=documents
MINIO_EMPLOYEE_DOCUMENTS_BUCKET=employee-documents
MINIO_EQUIPMENT_DOCUMENTS_BUCKET=equipment-documents
MINIO_GENERAL_BUCKET=general
```

## MinIO Server Setup

### Option 1: Docker (Recommended for Development)

```bash
# Run MinIO server with Docker
docker run -p 9000:9000 -p 9001:9001 \
  --name minio \
  -e "MINIO_ROOT_USER=minioadmin" \
  -e "MINIO_ROOT_PASSWORD=minioadmin123" \
  minio/minio server /data --console-address ":9001"
```

Access MinIO Console at: http://localhost:9001
- Username: minioadmin
- Password: minioadmin123

### Option 2: Local Installation

1. Download MinIO from [min.io](https://min.io/download)
2. Run MinIO server:
```bash
minio server /path/to/data --console-address ":9001"
```

## Bucket Creation

MinIO buckets are created automatically when the first file is uploaded. The following buckets will be created:

- `documents` - General document storage
- `employee-documents` - Employee-specific documents  
- `equipment-documents` - Equipment-specific documents
- `general` - Miscellaneous files

## Migration from Supabase

### 1. Run File Migration Script

```bash
# Install dependencies if not already installed
npm install

# Run the migration script
npx tsx scripts/migrate-supabase-to-minio.ts
```

This script will:
- Connect to your Supabase storage
- Download all files from Supabase buckets
- Upload them to corresponding MinIO buckets
- Provide detailed migration statistics

### 2. Update Database URLs

```bash
# Run the database URL update script
npx tsx scripts/update-database-urls-to-minio.ts
```

This script will:
- Find all Supabase URLs in your database
- Replace them with MinIO URLs
- Update employee_documents, media, and company_documents tables

## Usage

### 1. Using the MinIO Upload Hook

```tsx
import { useMinIOUpload } from '@/hooks/use-minio-upload';
import { STORAGE_BUCKETS } from '@/lib/minio/client';

const MyComponent = () => {
  const { uploadFile, isUploading, progress } = useMinIOUpload();

  const handleFileUpload = async (file: File) => {
    const result = await uploadFile(file, STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS, 'employee-123');
    
    if (result.success) {
      console.log('File uploaded:', result.url);
    }
  };

  return (
    <div>
      {/* Your upload UI */}
    </div>
  );
};
```

### 2. Using the MinIO Upload Component

```tsx
import { MinIOFileUpload } from '@/components/shared/MinIOFileUpload';
import { STORAGE_BUCKETS } from '@/lib/minio/client';

const MyComponent = () => {
  const handleUploadComplete = (result: any) => {
    if (result.success) {
      console.log('File uploaded:', result.url);
    }
  };

  return (
    <MinIOFileUpload
      bucket={STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS}
      path="employee-123"
      onUploadComplete={handleUploadComplete}
      multiple={true}
      maxFiles={5}
    />
  );
};
```

### 3. Direct API Usage

```tsx
import { MinIOStorageService } from '@/lib/minio/storage-service';
import { STORAGE_BUCKETS } from '@/lib/minio/client';

const uploadFile = async (file: File) => {
  const result = await MinIOStorageService.uploadFile(
    file, 
    STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS, 
    'employee-123'
  );
  
  if (result.success) {
    console.log('File uploaded:', result.url);
  }
};
```

## API Endpoints

### Upload File
- **POST** `/api/upload`
- **Body**: FormData with `file`, `type`, and optional `bucket`
- **Response**: Upload result with file URL and metadata

### Upload File (Supabase Route - Now Uses MinIO)
- **POST** `/api/upload-supabase`
- **Body**: FormData with `file`, `type`, and optional `bucket`
- **Response**: Upload result with file URL and metadata

## Features

- ✅ File type validation (PDF, JPG, JPEG, PNG, DOC, DOCX)
- ✅ File size validation (10MB max)
- ✅ Progress tracking
- ✅ Multiple file uploads
- ✅ Drag and drop interface
- ✅ Automatic bucket selection based on file type
- ✅ Error handling and user feedback
- ✅ Responsive design
- ✅ S3-compatible API

## Benefits of MinIO

- **Self-hosted**: Complete control over your data
- **S3-compatible**: Easy migration and compatibility
- **Cost-effective**: No per-request charges
- **High performance**: Optimized for speed
- **Scalable**: Can handle large amounts of data
- **Secure**: Built-in encryption and access controls

## Troubleshooting

### Connection Issues

1. **Check MinIO server status**:
   ```bash
   curl http://localhost:9000/minio/health/live
   ```

2. **Verify credentials**:
   - Ensure `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` are correct
   - Check that `S3_ENDPOINT` points to your MinIO server

3. **Check network connectivity**:
   - Ensure the MinIO server is accessible from your application
   - Check firewall settings

### Upload Issues

1. **File size limits**: Default limit is 10MB, can be adjusted in the service
2. **File type restrictions**: Only PDF, JPG, JPEG, PNG, DOC, DOCX are allowed
3. **Bucket permissions**: Ensure MinIO buckets are accessible

### Migration Issues

1. **Supabase connection**: Verify Supabase credentials are correct
2. **MinIO connection**: Ensure MinIO is running and accessible
3. **Database connection**: Check database credentials and connectivity

## Production Deployment

For production deployment with Coolify:

1. **Set environment variables** in Coolify dashboard:
   ```
   S3_ENDPOINT=https://your-minio-domain.com
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_production_access_key
   AWS_SECRET_ACCESS_KEY=your_production_secret_key
   ```

2. **Ensure MinIO server** is running and accessible
3. **Run migration scripts** in production environment
4. **Test file uploads** and downloads
5. **Monitor** MinIO server performance and storage usage
