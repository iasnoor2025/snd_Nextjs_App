# Production HTTPS Fix Checklist

## 🚨 Critical Issue
Your production environment has HTTP URLs causing Mixed Content errors when downloading documents.

## ✅ What We've Fixed in Code
- [x] Supabase client forces HTTPS URLs
- [x] Storage service converts all URLs to HTTPS
- [x] All API routes force HTTPS URLs
- [x] Created database migration script
- [x] Added robust URL utilities

## 🔧 Production Deployment Steps

### 1. Update Environment Variables
```bash
# In your production environment (Coolify dashboard)
NEXT_PUBLIC_SUPABASE_URL=https://supabasekong.snd-ksa.online
```

### 2. Deploy Updated Code
- [ ] Push the updated code to production
- [ ] Ensure all HTTPS fixes are included
- [ ] Verify the build completes successfully

### 3. Run Database Migration
```sql
-- Run this SQL in your production database
UPDATE employee_documents 
SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';

UPDATE media 
SET file_path = REPLACE(file_path, 'http://supabasekong.snd-ksa.online', 'https://supabasekong.snd-ksa.online')
WHERE file_path LIKE 'http://supabasekong.snd-ksa.online%';
```

### 4. Clear Application Cache
- [ ] Clear Redis cache if using Redis
- [ ] Restart the application
- [ ] Clear browser cache for testing

### 5. Test the Fix
- [ ] Navigate to employee management page
- [ ] Try to download a document (e.g., passport-1.jpg)
- [ ] Check browser console for errors
- [ ] Verify document downloads successfully

## 🔍 Verification Steps

### Check Browser Console
- [ ] No "Mixed Content" errors
- [ ] No "Failed to fetch" errors
- [ ] All URLs start with `https://`

### Check Network Tab
- [ ] Document requests use HTTPS
- [ ] No HTTP requests blocked
- [ ] Downloads complete successfully

### Check Database
- [ ] All `file_path` fields use HTTPS
- [ ] No HTTP URLs remain

## 🚀 Why This Fix Works

1. **Client Level**: Supabase client automatically converts HTTP to HTTPS
2. **Service Level**: Storage service ensures all generated URLs are HTTPS
3. **API Level**: All document endpoints convert HTTP URLs to HTTPS
4. **Database Level**: Migration updates existing HTTP URLs to HTTPS

## 🆘 If Still Not Working

### Check Environment Variables
```bash
# Verify in production
echo $NEXT_PUBLIC_SUPABASE_URL
# Should output: https://supabasekong.snd-ksa.online
```

### Check Application Logs
- Look for "Supabase URL (original)" and "Supabase URL (secure)" logs
- Verify HTTPS conversion is happening

### Force Cache Clear
- Clear all caches (Redis, application, browser)
- Restart the application completely

## 📞 Support
If issues persist after following this checklist, check:
1. Environment variable configuration
2. Application restart
3. Database migration execution
4. Browser cache clearing
