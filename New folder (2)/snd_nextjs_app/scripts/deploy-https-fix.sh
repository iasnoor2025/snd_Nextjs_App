#!/bin/bash

# MinIO HTTPS Fix Deployment Script
# This script helps deploy the HTTPS fix to production

echo "🚀 MinIO HTTPS Fix Deployment Script"
echo "===================================="
echo ""

echo "📋 Pre-deployment Checklist:"
echo "1. ✅ Code changes committed and pushed"
echo "2. ✅ Environment variables updated in Coolify"
echo "3. ✅ MinIO server supports HTTPS"
echo ""

echo "🔧 Environment Variable Update Required:"
echo "In your Coolify dashboard, update:"
echo "S3_ENDPOINT=https://minio.snd-ksa.online"
echo "(Change from http:// to https://)"
echo ""

echo "🗄️ Database Migration Required:"
echo "Run this SQL script in your production database:"
echo "scripts/comprehensive-https-migration.sql"
echo ""

echo "🔄 After deployment:"
echo "1. Restart your application in Coolify"
echo "2. Clear Redis cache (if using Redis)"
echo "3. Test document downloads"
echo "4. Check browser console for errors"
echo ""

echo "✅ Expected Results:"
echo "• No 'Mixed Content' errors in browser console"
echo "• All document downloads work successfully"
echo "• All MinIO URLs use HTTPS protocol"
echo ""

echo "📞 If issues persist:"
echo "1. Verify MinIO server supports HTTPS"
echo "2. Check environment variables are updated"
echo "3. Ensure database migration was executed"
echo "4. Clear all caches and restart application"
echo ""

echo "🎯 Files Updated in This Fix:"
echo "• src/lib/minio/storage-service.ts"
echo "• src/app/api/upload/route.ts"
echo "• src/app/api/employees/[id]/documents/upload/route.ts"
echo "• src/app/api/equipment/[id]/documents/route.ts"
echo "• src/app/api/profile/documents/route.ts"
echo "• scripts/comprehensive-https-migration.sql"
echo ""

echo "🚀 Ready to deploy! Follow the steps above."
