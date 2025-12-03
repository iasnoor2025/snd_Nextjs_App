# MinIO HTTPS Mixed Content Fix - COMPLETE SOLUTION

## 🚨 Root Cause Identified
The mixed content error was caused by **download endpoints returning raw HTTP URLs** from the database without HTTPS conversion. Even though we fixed URL generation for new uploads, existing URLs in the database were still HTTP.

## ✅ Complete Fix Applied

### **Files Updated (7 total):**

1. **`src/lib/minio/storage-service.ts`** - Forces HTTPS in all new file operations
2. **`src/app/api/upload/route.ts`** - Upload endpoint URL generation
3. **`src/app/api/employees/[id]/documents/upload/route.ts`** - Employee uploads
4. **`src/app/api/equipment/[id]/documents/route.ts`** - Equipment uploads
5. **`src/app/api/profile/documents/route.ts`** - Profile documents (NEW FIX)
6. **`src/app/api/employees/[id]/documents/[documentId]/download/route.ts`** - Employee downloads (CRITICAL FIX)
7. **`src/app/api/equipment/[id]/documents/[documentId]/download/route.ts`** - Equipment downloads (CRITICAL FIX)

### **Key Changes Made:**

```typescript
// Before (causing mixed content errors)
downloadUrl: documentRecord.filePath

// After (forces HTTPS)
downloadUrl: ensureHttps(documentRecord.filePath)
```

### **Database Migration Scripts:**
- `scripts/fix-minio-https-urls.sql` - Basic migration
- `scripts/comprehensive-https-migration.sql` - Complete migration with verification

## 🚀 **CRITICAL DEPLOYMENT STEPS**

### **1. Update Environment Variable (REQUIRED)**
In your Coolify dashboard:
```
S3_ENDPOINT=https://minio.snd-ksa.online
```
**Change from `http://` to `https://`**

### **2. Deploy Updated Code**
- Push all updated files to production
- Ensure build completes successfully

### **3. Run Database Migration (REQUIRED)**
Execute in your production database:
```sql
-- Run scripts/comprehensive-https-migration.sql
UPDATE employee_documents 
SET file_path = REPLACE(file_path, 'http://minio.snd-ksa.online', 'https://minio.snd-ksa.online')
WHERE file_path LIKE 'http://minio.snd-ksa.online%';
```

### **4. Restart Application**
- Restart your application in Coolify
- Clear Redis cache (if using Redis)

### **5. Test Document Downloads**
- Navigate to employee management page
- Try downloading "Employee-Iqama.jpg" or any document
- Check browser console - should see NO mixed content errors

## 🎯 **What This Fix Accomplishes**

### **Immediate Fix:**
- ✅ Download endpoints now return HTTPS URLs
- ✅ No more "Mixed Content" errors
- ✅ All document downloads work over HTTPS

### **Future-Proof:**
- ✅ All new uploads automatically use HTTPS
- ✅ All API endpoints convert HTTP to HTTPS
- ✅ Database migration updates existing URLs

### **Comprehensive Coverage:**
- ✅ Employee document downloads
- ✅ Equipment document downloads  
- ✅ Profile document access
- ✅ File upload operations
- ✅ URL generation in all services

## 🔍 **Verification Steps**

### **Browser Console Check:**
- ❌ No "Mixed Content" errors
- ❌ No "Failed to fetch" errors
- ✅ All URLs start with `https://`

### **Network Tab Check:**
- ✅ Document requests use HTTPS
- ✅ Downloads complete successfully
- ✅ No HTTP requests blocked

### **Database Check:**
```sql
-- Should return 0 HTTP URLs
SELECT COUNT(*) FROM employee_documents 
WHERE file_path LIKE 'http://minio.snd-ksa.online%';
```

## 🚨 **Critical Notes**

1. **Environment Variable**: Must update `S3_ENDPOINT` to HTTPS
2. **Database Migration**: Required to update existing HTTP URLs
3. **MinIO Server**: Must support HTTPS
4. **Cache Clearing**: Clear all caches after deployment

## 📞 **If Issues Persist**

1. **Verify MinIO HTTPS**: Ensure MinIO server supports HTTPS
2. **Check Environment**: Confirm `S3_ENDPOINT` uses HTTPS
3. **Database Check**: Ensure migration was executed
4. **Cache Clear**: Clear all caches and restart application
5. **Browser Cache**: Clear browser cache for testing

## 🎉 **Expected Result**

After implementing this complete fix:
- ✅ **Zero mixed content errors**
- ✅ **All document downloads work**
- ✅ **All MinIO URLs use HTTPS**
- ✅ **Future uploads automatically HTTPS**
- ✅ **Complete production-ready solution**

The fix addresses both the immediate issue (download endpoints) and prevents future occurrences (URL generation + database migration).
