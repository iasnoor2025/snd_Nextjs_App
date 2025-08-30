# Redis Development Configuration

## Disable Redis for Development

To disable Redis during development (which will skip Redis connection attempts and use direct database queries), you have two options:

### Option 1: Set REDIS_URL to empty (Recommended)

Add this to your `.env.local` file:

```bash
# Disable Redis for development
REDIS_URL=""
```

### Option 2: Use REDIS_ENABLED flag

Add this to your `.env.local` file:

```bash
# Disable Redis for development
REDIS_ENABLED=false
```

## Check Redis Status

Run this command to check your current Redis configuration:

```bash
npm run check:redis
```

## What Happens When Redis is Disabled

- ✅ No Redis connection attempts
- ✅ No Redis-related errors in console
- ✅ All cache operations are skipped gracefully
- ✅ Database queries work normally (no caching)
- ✅ Application runs without Redis dependency

## Re-enable Redis

To re-enable Redis, simply:

1. **Remove or comment out** the `REDIS_URL=""` line from `.env.local`
2. **Or set** `REDIS_ENABLED=true` in `.env.local`
3. **Set** `REDIS_URL="redis://localhost:6379"` (or your Redis server URL)
4. **Restart** your development server

## Benefits of Disabling Redis in Development

- **Faster startup**: No Redis connection delays
- **Simpler setup**: No need to run Redis locally
- **Cleaner logs**: No Redis connection messages
- **Easier debugging**: Direct database queries without cache layer
- **No dependencies**: Works without Redis server

## Production

Remember to properly configure Redis for production by setting:
- `REDIS_URL` to your Redis server
- Ensure Redis server is running and accessible
