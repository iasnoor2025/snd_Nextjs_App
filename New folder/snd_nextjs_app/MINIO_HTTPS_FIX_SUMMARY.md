# MinIO HTTPS Mixed Content Fix Summary

## 🚨 Problem Identified
Your production environment was experiencing mixed content errors because:
- Main application served over HTTPS: `https://myapp.snd-ksa.online`
- MinIO server configured with HTTP: `http://minio.snd-ksa.online`
- Browsers block HTTP resources on HTTPS pages for security

## ✅ Solution Implemented

### 1. Code Updates
**Files Modified:**
- `src/lib/minio/storage-service.ts` - Updated URL generation to force HTTPS
- `src/app/api/upload/route.ts` - Updated upload endpoint URL generation
- `src/app/api/employees/[id]/documents/upload/route.ts` - Updated employee upload URLs
- `src/app/api/equipment/[id]/documents/route.ts` - Updated equipment upload URLs

**Changes Made:**
```typescript
// Before
const url = `${baseUrl}/${bucket}/${filePath}`;

// After - Forces HTTPS
const secureUrl = baseUrl?.replace(/^http:\/\//, 'https://') || baseUrl;
const url = `${secureUrl}/${bucket}/${filePath}`;
```

### 2. Database Migration
**Created:** `scripts/fix-minio-https-urls.sql`
- Updates all existing HTTP MinIO URLs to HTTPS
- Affects tables: `employee_documents`, `equipment_documents`, `media`
- Safe migration that only updates HTTP URLs

### 3. Production Fix Script
**Created:** `scripts/fix-minio-https-production.js`
- Comprehensive guide for production deployment
- Step-by-step instructions
- Verification steps

### 4. Documentation Updates
**Updated:** `docs/MINIO_SETUP.md`
- Changed examples to use HTTPS endpoints
- Added production HTTPS requirements
- Updated environment variable examples

## 🚀 Deployment Steps

### Step 1: Update Environment Variables
In your Coolify dashboard, update:
```
S3_ENDPOINT=https://minio.snd-ksa.online
```
(Change from `http://` to `https://`)

### Step 2: Deploy Updated Code
- Push the updated code to production
- Ensure build completes successfully

### Step 3: Run Database Migration
Execute the SQL script:
```sql
-- Run scripts/fix-minio-https-urls.sql in your production database
```

### Step 4: Restart Application
- Restart your application in Coolify
- Clear any caches (Redis, application cache)

### Step 5: Verify Fix
- Navigate to employee management page
- Try downloading a document
- Check browser console - should see no mixed content errors

## 🔍 What This Fix Accomplishes

1. **Eliminates Mixed Content Errors**: All MinIO URLs now use HTTPS
2. **Maintains Functionality**: File uploads/downloads continue to work
3. **Future-Proof**: All new uploads automatically use HTTPS URLs
4. **Database Consistency**: Existing URLs updated to HTTPS
5. **Security Compliance**: Meets browser security requirements

## ⚠️ Important Notes

- **MinIO Server**: Ensure your MinIO server supports HTTPS
- **Environment Variables**: Must update `S3_ENDPOINT` to use HTTPS
- **Database Migration**: Required to update existing HTTP URLs
- **Testing**: Verify file downloads work after deployment

## 🎯 Expected Results

After implementing this fix:
- ✅ No "Mixed Content" errors in browser console
- ✅ All document downloads work successfully
- ✅ All MinIO URLs use HTTPS protocol
- ✅ File uploads continue to work normally
- ✅ Existing files accessible via HTTPS

## 📞 Troubleshooting

If issues persist after following the steps:

1. **Verify MinIO HTTPS**: Ensure MinIO server supports HTTPS
2. **Check Environment**: Confirm `S3_ENDPOINT` uses HTTPS
3. **Database Check**: Ensure migration was executed
4. **Cache Clear**: Clear all caches and restart application
5. **Browser Cache**: Clear browser cache for testing

## 🔧 Technical Details

**URL Conversion Logic:**
```typescript
const secureUrl = baseUrl?.replace(/^http:\/\//, 'https://') || baseUrl;
```

**Database Update Pattern:**
```sql
UPDATE table_name 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';
```

This fix ensures your application works seamlessly with HTTPS while maintaining all existing functionality.
