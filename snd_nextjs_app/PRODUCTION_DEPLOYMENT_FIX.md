# Production Deployment Fix for ERPNext API 500 Error

## Problem Description
The equipment sync API is working fine in development but failing with a 500 error in production. This is caused by environment variables not being properly loaded in the production environment.

## Root Cause
1. **Environment Variable Mismatch**: Production environment is missing the `NEXT_PUBLIC_` prefix for ERPNext API credentials
2. **Build-time vs Runtime**: Environment variables need to be available both at build time and runtime
3. **Configuration Loading**: Production server is not loading the correct environment configuration

## Solution Steps

### 1. Update Production Environment Variables

In your production server (Coolify), set these environment variables:

```bash
# ERPNext Integration - Production
NEXT_PUBLIC_ERPNEXT_URL=https://erp.snd-ksa.online
NEXT_PUBLIC_ERPNEXT_API_KEY=4f15149f23e29b8
NEXT_PUBLIC_ERPNEXT_API_SECRET=0be547162a5a45e

# Database Configuration
DATABASE_URL=postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db

# NextAuth Configuration
NEXTAUTH_URL=https://myapp.snd-ksa.online
NEXTAUTH_SECRET=your-production-secret-key-here-change-this-immediately

# App Configuration
APP_URL=https://myapp.snd-ksa.online
NEXT_PUBLIC_API_URL=https://myapp.snd-ksa.online/api

# Production Settings
NODE_ENV=production
```

### 2. Coolify Environment Variable Setup

1. Go to your Coolify dashboard
2. Navigate to your Next.js app
3. Go to **Environment Variables** section
4. Add/update the following variables:

```
Key: NEXT_PUBLIC_ERPNEXT_URL
Value: https://erp.snd-ksa.online

Key: NEXT_PUBLIC_ERPNEXT_API_KEY  
Value: 4f15149f23e29b8

Key: NEXT_PUBLIC_ERPNEXT_API_SECRET
Value: 0be547162a5a45e

Key: DATABASE_URL
Value: postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db

Key: NEXTAUTH_URL
Value: https://myapp.snd-ksa.online

Key: NODE_ENV
Value: production
```

### 3. Redeploy the Application

After setting the environment variables:

1. **Redeploy** your application in Coolify
2. **Restart** the container to ensure new environment variables are loaded
3. **Clear** any cached builds

### 4. Verify the Fix

Test the equipment sync API:

```bash
# Test the API endpoint
curl -X POST https://myapp.snd-ksa.online/api/equipment/sync

# Check the response and server logs
```

## Code Changes Made

### 1. Enhanced Environment Variable Handling

Updated `src/app/api/equipment/sync/route.ts` to:
- Check both `NEXT_PUBLIC_` and non-`NEXT_PUBLIC_` versions of environment variables
- Provide detailed logging for production debugging
- Give better error messages with missing variable information

### 2. Next.js Configuration Update

Updated `next.config.mjs` to:
- Explicitly include ERPNext environment variables in the build
- Ensure variables are available at both build time and runtime

## Testing the Fix

### 1. Check Environment Variables

The API now logs detailed environment information:

```javascript
console.log('🔧 Equipment Sync Environment Check:');
console.log('  - ERPNEXT_URL:', ERPNEXT_URL ? '✅ Set' : '❌ Missing');
console.log('  - ERPNEXT_API_KEY:', ERPNEXT_API_KEY ? '✅ Set' : '❌ Missing');
console.log('  - ERPNEXT_API_SECRET:', ERPNEXT_API_SECRET ? '✅ Set' : '❌ Missing');
```

### 2. Monitor Server Logs

Check your production server logs for:
- ✅ Environment variable status
- ✅ Database connection status
- ✅ ERPNext API request details
- ❌ Any error messages

## Common Issues and Solutions

### Issue 1: Environment Variables Still Not Loading
**Solution**: Ensure variables are set in Coolify and redeploy the application

### Issue 2: ERPNext API Still Failing
**Solution**: Check if the production server can reach `https://erp.snd-ksa.online`

### Issue 3: Database Connection Issues
**Solution**: Verify `DATABASE_URL` is correct and accessible from production server

## Prevention for Future Deployments

1. **Always test environment variables** in production before going live
2. **Use consistent naming** for environment variables across environments
3. **Document required variables** for each deployment environment
4. **Monitor logs** after deployment to catch issues early

## Next Steps

1. ✅ Set environment variables in Coolify
2. ✅ Redeploy the application
3. ✅ Test the equipment sync API
4. ✅ Monitor server logs for any remaining issues
5. ✅ Update other API routes if they have similar issues

## Support

If you continue to experience issues:
1. Check the production server logs for detailed error messages
2. Verify network connectivity between production server and ERPNext
3. Ensure all environment variables are properly set in Coolify
4. Test with a simple API endpoint first before testing complex sync operations
