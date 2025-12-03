# Redis Caching Setup Guide

This guide will help you set up Redis caching for your Next.js application to improve database query performance.

## Prerequisites

- Node.js 18+ installed
- Redis server running (local or remote)

## Installation

The Redis dependencies have already been installed:

```bash
npm install redis ioredis
npm install --save-dev @types/redis
```

## Environment Configuration

Add the following environment variables to your `.env.local` file:

```bash
# Redis Configuration
REDIS_URL="redis://localhost:6379"
```

### Redis URL Formats

- **Local Redis**: `redis://localhost:6379`
- **Redis with password**: `redis://username:password@localhost:6379`
- **Redis with database**: `redis://localhost:6379/0`
- **Redis Sentinel**: `redis+sentinel://localhost:26379/mymaster`
- **Redis Cluster**: `redis+cluster://localhost:7000,localhost:7001`

## Redis Server Setup

### Option 1: Local Redis (Development)

#### Windows
1. Download Redis for Windows from: https://github.com/microsoftarchive/redis/releases
2. Install and start the Redis service
3. Or use WSL2 and install Redis on Ubuntu

#### macOS
```bash
brew install redis
brew services start redis
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### Option 2: Docker Redis
```bash
docker run -d --name redis -p 6379:6379 redis:alpine
```

### Option 3: Cloud Redis
- **Redis Cloud**: https://redis.com/try-free/
- **AWS ElastiCache**: Redis-compatible service
- **Azure Cache for Redis**: Managed Redis service

## Usage Examples

### 1. Basic Caching in Services

```typescript
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

export class UserService {
  static async getUsers() {
    return cacheQueryResult(
      generateCacheKey('users', 'list'),
      async () => {
        // Your database query here
        return await db.select().from(users);
      },
      {
        ttl: 300, // 5 minutes
        tags: [CACHE_TAGS.USERS]
      }
    );
  }
}
```

### 2. Using the Decorator

```typescript
import { cacheQuery } from '@/lib/redis';

export class ProductService {
  @cacheQuery({ ttl: 600, tags: ['products'] })
  static async getProducts() {
    return await db.select().from(products);
  }
}
```

### 3. Manual Cache Management

```typescript
import { cacheService, invalidateCache } from '@/lib/redis';

// Set cache
await cacheService.set('key', data, { ttl: 300, tags: ['users'] });

// Get cache
const data = await cacheService.get('key');

// Invalidate cache
await invalidateCache(['users']);
```

## Cache Management

### Admin API Endpoints

- `GET /api/admin/cache` - Get cache statistics
- `DELETE /api/admin/cache?action=clear-all` - Clear all cache
- `DELETE /api/admin/cache?action=clear-tag&target=users` - Clear cache by tag
- `POST /api/admin/cache` - Clear specific cache types

### Frontend Cache Management

Use the `useCacheManagement` hook in your admin components:

```typescript
import { useCacheManagement } from '@/hooks/use-cache-management';

function AdminPanel() {
  const { 
    cacheStats, 
    clearAllCache, 
    clearEmployeesCache 
  } = useCacheManagement();

  return (
    <div>
      <p>Cache Keys: {cacheStats?.keys}</p>
      <button onClick={clearEmployeesCache}>Clear Employee Cache</button>
      <button onClick={clearAllCache}>Clear All Cache</button>
    </div>
  );
}
```

## Cache Tags and Prefixes

The system uses organized cache tags for easy management:

- `users` - User-related data
- `employees` - Employee data
- `customers` - Customer data
- `equipment` - Equipment data
- `rentals` - Rental data
- `dashboard` - Dashboard statistics
- `reports` - Report data
- `analytics` - Analytics data

## Performance Benefits

- **Reduced Database Load**: Frequently accessed data is served from memory
- **Faster Response Times**: Cache hits are 10-100x faster than database queries
- **Better User Experience**: Reduced loading times for common operations
- **Scalability**: Database can handle more concurrent users

## Monitoring

### Cache Statistics
- Monitor cache hit rates
- Track memory usage
- Check connection status
- View active cache keys

### Cache Invalidation
- Automatic invalidation on data changes
- Manual invalidation for maintenance
- Tag-based invalidation for specific data types

## Best Practices

1. **Set Appropriate TTL**: Balance freshness with performance
2. **Use Meaningful Tags**: Organize cache by data type
3. **Monitor Memory Usage**: Prevent Redis from running out of memory
4. **Handle Cache Failures**: Ensure app works without cache
5. **Invalidate Strategically**: Clear only necessary cache when data changes

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check if Redis server is running
   - Verify REDIS_URL format
   - Check firewall/network settings

2. **Cache Not Working**
   - Verify Redis connection in logs
   - Check cache statistics endpoint
   - Ensure cache keys are being generated correctly

3. **Memory Issues**
   - Monitor Redis memory usage
   - Adjust TTL values
   - Implement cache eviction policies

### Debug Mode

Enable debug logging by setting:

```bash
DEBUG=redis:*
```

## Production Considerations

1. **Redis Persistence**: Configure RDB/AOF for data durability
2. **High Availability**: Use Redis Sentinel or Redis Cluster
3. **Security**: Enable Redis authentication and network security
4. **Monitoring**: Use Redis INFO command or monitoring tools
5. **Backup**: Regular Redis data backups

## Support

For issues or questions:
1. Check Redis server logs
2. Verify environment configuration
3. Test Redis connection manually
4. Review application logs for cache errors
