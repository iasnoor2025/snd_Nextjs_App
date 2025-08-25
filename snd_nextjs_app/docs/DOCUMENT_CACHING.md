# Document Caching System

This document describes the implementation of Redis-based caching for the document management system in the Next.js application.

## Overview

The document caching system provides performance improvements by caching frequently accessed document data, reducing database queries and Supabase storage API calls.

## Architecture

### Components

1. **DocumentCacheService** (`src/lib/redis/document-cache-service.ts`)
   - Specialized service for managing document-related caches
   - Provides methods for caching, retrieving, and invalidating document data
   - Supports both employee and equipment documents

2. **Cache Integration in API Routes**
   - Employee documents: `/api/employees/[id]/documents`
   - Equipment documents: `/api/equipment/[id]/documents`
   - General documents: `/api/documents/supabase`

3. **Cache Management UI**
   - Admin interface for clearing specific document caches
   - Integration with existing cache management system

## Cache Keys

### Employee Documents
- **Pattern**: `app:documents:employee:{employeeId}:documents`
- **Example**: `app:documents:employee:123:documents`
- **TTL**: 5 minutes (300 seconds)

### Equipment Documents
- **Pattern**: `app:documents:equipment:{equipmentId}:documents`
- **Example**: `app:documents:equipment:456:documents`
- **TTL**: 5 minutes (300 seconds)

### General Documents List
- **Pattern**: `app:documents:documents:{type}:{limit}`
- **Example**: `app:documents:documents:all:10`
- **TTL**: 5 minutes (300 seconds)

## Cache Tags

### Employee Documents
- `documents`
- `employee`
- `employee:{employeeId}`

### Equipment Documents
- `documents`
- `equipment`
- `equipment:{equipmentId}`

### General Documents
- `documents`
- `{type}` (e.g., `all`, `employee`, `equipment`)

## Usage Examples

### Caching Employee Documents

```typescript
import { documentCacheService } from '@/lib/redis/document-cache-service';

// Cache employee documents
await documentCacheService.cacheEmployeeDocuments(123, documents);

// Retrieve from cache
const cachedDocs = await documentCacheService.getEmployeeDocuments(123);

// Invalidate cache
await documentCacheService.invalidateEmployeeDocuments(123);
```

### Caching Equipment Documents

```typescript
// Cache equipment documents
await documentCacheService.cacheEquipmentDocuments(456, documents);

// Retrieve from cache
const cachedDocs = await documentCacheService.getEquipmentDocuments(456);

// Invalidate cache
await documentCacheService.invalidateEquipmentDocuments(456);
```

### Caching General Documents List

```typescript
// Cache general documents list
await documentCacheService.cacheDocumentsList('all', 10, documentsList);

// Retrieve from cache
const cachedList = await documentCacheService.getDocumentsList('all', 10);
```

## Cache Invalidation Strategy

### Automatic Invalidation
- **Upload**: Cache is invalidated when new documents are uploaded
- **Deletion**: Cache is invalidated when documents are deleted
- **Updates**: Cache is invalidated when documents are modified

### Manual Invalidation
- **Admin UI**: Cache management interface for manual clearing
- **API Endpoints**: Direct cache invalidation via API calls
- **Tag-based**: Clear all caches of a specific type

### Invalidation Methods

```typescript
// Invalidate specific employee documents
await documentCacheService.invalidateEmployeeDocuments(123);

// Invalidate specific equipment documents
await documentCacheService.invalidateEquipmentDocuments(456);

// Invalidate all document caches
await documentCacheService.invalidateAllDocumentCaches();

// Invalidate by type
await documentCacheService.invalidateCachesByType('employee');
await documentCacheService.invalidateCachesByType('equipment');
```

## Performance Benefits

### Before Caching
- Every document request hits the database
- Supabase storage API calls on every request
- Slower response times for frequent requests
- Higher database load

### After Caching
- First request: Database + Storage (cache miss)
- Subsequent requests: Redis cache (cache hit)
- 5-10x faster response times for cached data
- Reduced database and storage API load
- Better user experience

## Cache Statistics

The system provides detailed cache statistics:

```typescript
const stats = await documentCacheService.getDocumentCacheStats();
console.log(stats);
// Output:
// {
//   keys: 15,
//   memory: "2.5MB",
//   connected: true,
//   documentCaches: {
//     employee: 8,
//     equipment: 5,
//     general: 2
//   }
// }
```

## Testing

Run the caching test script to verify functionality:

```bash
npm run tsx src/scripts/test-document-caching.ts
```

This will test:
- Document caching and retrieval
- Cache invalidation
- Tag-based clearing
- Statistics collection
- Complete cache clearing

## Configuration

### Redis Connection
- Uses existing Redis configuration from `src/lib/redis/`
- Requires Redis server to be running
- Fallback to database if Redis is unavailable

### Cache TTL
- Default: 5 minutes (300 seconds)
- Configurable per cache operation
- Balance between performance and data freshness

### Cache Size
- Monitor Redis memory usage
- Implement cache eviction policies if needed
- Consider adjusting TTL based on usage patterns

## Monitoring and Maintenance

### Cache Hit Rate
- Monitor cache hit/miss ratios
- Adjust TTL based on access patterns
- Consider pre-warming frequently accessed caches

### Memory Usage
- Monitor Redis memory consumption
- Implement cache size limits if needed
- Regular cleanup of expired caches

### Error Handling
- Graceful fallback to database on cache failures
- Logging of cache operations and errors
- Health checks for Redis connection

## Best Practices

1. **Cache Key Naming**: Use consistent, descriptive cache keys
2. **TTL Management**: Set appropriate TTL based on data volatility
3. **Tag Usage**: Use tags for efficient bulk invalidation
4. **Error Handling**: Always handle cache failures gracefully
5. **Monitoring**: Track cache performance and hit rates
6. **Cleanup**: Regularly clear unused or expired caches

## Troubleshooting

### Common Issues

1. **Cache Misses**: Check Redis connection and key patterns
2. **Memory Issues**: Monitor Redis memory usage and adjust TTL
3. **Stale Data**: Verify cache invalidation is working properly
4. **Performance**: Check cache hit rates and adjust strategy

### Debug Commands

```typescript
// Check Redis connection
const stats = await cacheService.getStats();
console.log('Redis connected:', stats.connected);

// List all document cache keys
const keys = await redisService.getClient().keys('app:documents:*');
console.log('Document cache keys:', keys);

// Clear specific cache
await cacheService.delete('employee:123:documents', 'documents');
```

## Future Enhancements

1. **Cache Warming**: Pre-populate frequently accessed caches
2. **Compression**: Compress large document lists in cache
3. **Distributed Caching**: Support for Redis cluster
4. **Cache Analytics**: Detailed performance metrics and insights
5. **Smart Invalidation**: Intelligent cache invalidation based on data changes
6. **Cache Persistence**: Persistent cache across application restarts
