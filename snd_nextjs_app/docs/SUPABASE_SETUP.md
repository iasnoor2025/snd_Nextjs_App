# Supabase File Storage Integration

This document explains how to set up and use Supabase for file uploads in your Next.js application.

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key

### 2. Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Create Storage Buckets

In your Supabase dashboard, create the following storage buckets:

- `documents` - General document storage
- `employee-documents` - Employee-specific documents
- `equipment-documents` - Equipment-specific documents
- `general` - Miscellaneous files

### 4. Configure Storage Policies

Set up Row Level Security (RLS) policies for your storage buckets. Here are example policies:

#### For `documents` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view
CREATE POLICY "Allow authenticated view" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');
```

#### For `employee-documents` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view
CREATE POLICY "Allow authenticated view" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');
```

#### For `equipment-documents` bucket:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads" ON storage.objects
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to view
CREATE POLICY "Allow authenticated view" ON storage.objects
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to delete their own uploads
CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE USING (auth.role() = 'authenticated');
```

## Usage

### 1. Using the Upload Hook

```tsx
import { useSupabaseUpload } from '@/hooks/use-supabase-upload';
import { STORAGE_BUCKETS } from '@/lib/supabase/storage-service';

const MyComponent = () => {
  const { uploadFile, isUploading, progress } = useSupabaseUpload();

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

### 2. Using the Upload Component

```tsx
import { SupabaseFileUpload } from '@/components/shared/SupabaseFileUpload';
import { STORAGE_BUCKETS } from '@/lib/supabase/storage-service';

const MyComponent = () => {
  const handleUploadComplete = (result: any) => {
    if (result.success) {
      console.log('File uploaded:', result.url);
    }
  };

  return (
    <SupabaseFileUpload
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
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { STORAGE_BUCKETS } from '@/lib/supabase/storage-service';

const uploadFile = async (file: File) => {
  const result = await SupabaseStorageService.uploadFile(
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
- **POST** `/api/upload-supabase`
- **Body**: FormData with `file`, `type`, and optional `bucket`
- **Response**: Upload result with file URL and metadata

### Example Request
```javascript
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'employee');
formData.append('bucket', 'employee-documents');

const response = await fetch('/api/upload-supabase', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

## Features

- ✅ File type validation (PDF, JPG, JPEG, PNG, DOC, DOCX)
- ✅ File size validation (10MB max)
- ✅ Progress tracking
- ✅ Multiple file uploads
- ✅ Drag and drop interface
- ✅ Automatic bucket selection based on file type
- ✅ Error handling and user feedback
- ✅ Responsive design

## Migration from S3/MinIO

To migrate from your current S3/MinIO setup:

1. **Keep both systems**: The new Supabase integration runs alongside your existing S3 setup
2. **Gradual migration**: Update components one by one to use Supabase
3. **Data migration**: Use the storage service to copy files from S3 to Supabase if needed
4. **Update database**: Modify your document records to point to Supabase URLs instead of S3 URLs

## Benefits of Supabase

- **Built-in authentication**: Integrates with your existing auth system
- **Real-time subscriptions**: Get notified of file changes
- **Row Level Security**: Fine-grained access control
- **Automatic CDN**: Global file distribution
- **Database integration**: Store file metadata alongside your data
- **Cost-effective**: Generous free tier and predictable pricing

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure your Supabase project allows your domain
2. **Authentication errors**: Check that your anon key is correct
3. **Storage policy errors**: Verify your RLS policies are set up correctly
4. **File size limits**: Check that files don't exceed the 10MB limit

### Debug Mode

Enable debug logging by setting:
```bash
NEXT_PUBLIC_SUPABASE_DEBUG=true
```

This will log all Supabase operations to the console for debugging purposes.
