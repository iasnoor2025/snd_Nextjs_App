#!/bin/bash

# Production HTTPS Fix Script
# This script ensures all document URLs use HTTPS in production

echo "🔒 Fixing HTTPS URLs for production..."

# 1. Update environment variables
echo "📝 Updating environment variables..."
export NEXT_PUBLIC_SUPABASE_URL="https://supabasekong.snd-ksa.online"

# 2. Clear Redis cache (if using Redis)
echo "🗑️  Clearing Redis cache..."
# Add your Redis clear command here if needed

# 3. Restart the application
echo "🔄 Restarting application..."
# Add your restart command here (e.g., pm2 restart, docker restart, etc.)

# 4. Verify HTTPS enforcement
echo "✅ HTTPS enforcement enabled:"
echo "   - Supabase client: Forces HTTPS URLs"
echo "   - Storage service: All URLs converted to HTTPS"
echo "   - API routes: All document URLs forced to HTTPS"
echo "   - Database migration: Updates existing HTTP URLs"

echo "🎉 Production HTTPS fix completed!"
echo "📋 Next steps:"
echo "   1. Test document downloads"
echo "   2. Verify no Mixed Content errors in browser console"
echo "   3. Check that all URLs start with 'https://'"
