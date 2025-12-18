# Troubleshooting Roles API Error

## Issue
"Failed to fetch roles" error in user-management page

## Possible Causes

### 1. Server Needs Restart
After running the migration, the Next.js server may need to be restarted to pick up the database changes.

**Solution:**
```bash
# Stop the dev server (Ctrl+C) and restart
npm run dev
```

### 2. Redis Cache Issue
The error might be cached in Redis from before the migration.

**Solution:**
- Clear Redis cache, or
- Wait for cache TTL (10 minutes), or
- Restart Redis service

### 3. Database Connection Issue
The database might not be accessible or the migration didn't complete properly.

**Solution:**
```bash
# Verify the migration ran successfully
node scripts/run-role-color-migration.js
```

### 4. Check Server Logs
The enhanced error logging should show the actual error in the server console.

**Look for:**
- Database connection errors
- SQL syntax errors
- Redis connection errors

## Quick Fix

1. **Restart the dev server**
2. **Check browser console** for the actual error response
3. **Check server console** for detailed error logs
4. **Verify database** - Run a quick query to confirm the color column exists:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'roles' AND column_name = 'color';
   ```

## If Still Failing

The enhanced error logging will now show more details in development mode. Check the server console for the actual error message.

