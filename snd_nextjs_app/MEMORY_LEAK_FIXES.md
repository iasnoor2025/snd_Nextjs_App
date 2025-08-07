# Memory Leak Fixes for Next.js App

## Problem
The Next.js app was choking after multiple page refreshes due to memory leaks in:
- SSE (Server-Sent Events) connections
- React Query cache accumulation
- Event listener accumulation
- Improper cleanup of EventSource connections

## Solutions Implemented

### 1. Enhanced SSE Context (`src/contexts/sse-context.tsx`)
- **Component Mount Tracking**: Added `isMountedRef` to prevent state updates on unmounted components
- **Proper Event Listener Cleanup**: Store event listeners in refs and remove them properly
- **Enhanced Cleanup Function**: Comprehensive cleanup that closes connections and clears state
- **Memory Pressure Handling**: Added cleanup on page visibility changes and unload

### 2. Improved useSSE Hook (`src/hooks/use-sse.ts`)
- **Event Listener Management**: Store all event listeners in a Map for proper removal
- **Mount State Tracking**: Prevent operations on unmounted components
- **Enhanced Cleanup**: Remove all event listeners before closing connections
- **Memory Monitoring**: Added checks for component mount state

### 3. Query Client Optimization (`src/components/providers.tsx`)
- **Reduced Cache Time**: Set `gcTime` to 5 minutes for faster garbage collection
- **Disabled Refetch on Focus/Reconnect**: Prevents unnecessary API calls
- **Memory Manager Integration**: Added cleanup callbacks to memory manager
- **Automatic Cache Clearing**: Clear queries on page unload and visibility change

### 4. Memory Manager Utility (`src/lib/memory-manager.ts`)
- **Singleton Pattern**: Global memory management instance
- **Cleanup Callback System**: Centralized cleanup management
- **Memory Usage Monitoring**: Track memory usage and perform cleanup when needed
- **Browser Cache Management**: Clear caches and session storage when needed

### 5. Next.js Configuration (`next.config.ts`)
- **Webpack Optimization**: Better chunk splitting and vendor bundling
- **Memory Settings**: Reduced page buffer and concurrent features
- **Performance Optimizations**: Compression and memory-based workers

### 6. Development Tools
- **Cleanup Script**: `scripts/cleanup-dev.js` for development environment cleanup
- **NPM Scripts**: Added `cleanup` and `dev:fresh` commands

## Usage

### For Development
When the app starts choking during development:

```bash
# Option 1: Quick cleanup
npm run cleanup

# Option 2: Fresh start with cleanup
npm run dev:fresh

# Option 3: Manual cleanup
rm -rf .next
rm -rf node_modules/.cache
npm run db:generate
npm run dev
```

### For Production
The memory manager automatically:
- Monitors memory usage every 30 seconds
- Performs cleanup when memory usage exceeds 80%
- Cleans up on page unload and visibility changes
- Manages SSE connections and React Query cache

### Memory Monitoring
You can check memory usage in the browser console:

```javascript
// Get memory info
import { getMemoryInfo } from '@/lib/memory-manager';
console.log(getMemoryInfo());

// Check if memory usage is high
import { isMemoryUsageHigh } from '@/lib/memory-manager';
console.log(isMemoryUsageHigh(80)); // Returns true if >80% usage
```

## Key Improvements

### 1. Event Listener Management
- All event listeners are now stored and properly removed
- No more accumulating listeners on page refresh
- Proper cleanup of SSE connections

### 2. React Query Optimization
- Reduced cache time for faster garbage collection
- Disabled unnecessary refetches
- Automatic cache clearing on page events

### 3. Component Lifecycle Management
- Mount state tracking prevents memory leaks
- Proper cleanup on component unmount
- No state updates on unmounted components

### 4. Memory Monitoring
- Automatic memory usage monitoring
- Proactive cleanup when memory usage is high
- Browser cache management

## Performance Benefits

1. **Reduced Memory Usage**: Proper cleanup prevents memory accumulation
2. **Faster Page Loads**: Optimized caching and reduced unnecessary requests
3. **Stable Performance**: No more choking after multiple refreshes
4. **Better Resource Management**: Automatic cleanup of unused resources

## Monitoring

The app now includes:
- Memory usage monitoring
- Automatic cleanup triggers
- Development cleanup tools
- Performance optimization settings

## Troubleshooting

If you still experience issues:

1. **Run the cleanup script**: `npm run cleanup`
2. **Check memory usage**: Use browser dev tools
3. **Clear browser cache**: Hard refresh (Ctrl+F5)
4. **Restart development server**: `npm run dev:fresh`

## Future Improvements

- Add memory usage dashboard
- Implement more granular cleanup strategies
- Add performance monitoring tools
- Optimize bundle size further
