# Data Fetching and Page Refresh Optimization Summary

## Overview
Optimized the Next.js app to prevent unnecessary data fetching and page refreshes. The app now only fetches data when necessary and uses state updates instead of full page reloads.

## Changes Made

### 1. Created Smart Data Fetching Hook (`src/hooks/use-smart-fetch.ts`)
- **useSmartFetch**: Checks cache and existing data before fetching
- Skips fetch if data already exists
- Only fetches when dependencies change
- Supports tab-based lazy loading with `useTabBasedFetch`

### 2. Created App Refresh Hook (`src/hooks/use-app-refresh.ts`)
- Provides `refreshData()` to refresh router cache without full page reload
- `navigateTo()` and `replaceRoute()` for navigation
- `updateAndRefresh()` for mutations with automatic refresh

### 3. Dashboard Page Optimizations (`src/app/page.tsx`)
- **Initial fetch**: Only fetches if data doesn't exist (checks stats.totalEmployees, stats.totalProjects, stats.totalEquipment)
- **Auto-refresh**: Only refreshes data that already exists (prevents fetching on initial load)
- **Section-based fetching**: Only fetches equipment data if section is visible AND data doesn't exist

### 4. Detail Pages Optimizations

#### Project Detail Page (`src/app/[locale]/modules/project-management/[id]/page.tsx`)
- Checks if `project` and `resources.length > 0` before fetching
- Replaced all `window.location.reload()` calls with proper `fetchProjectData()` calls
- Retry buttons now refresh data instead of reloading the page

#### Customer Detail Page (`src/app/[locale]/modules/customer-management/[id]/page.tsx`)
- Checks if `customer` and `rentals.length > 0` before fetching
- Only updates state if data doesn't exist

#### Equipment Assignment Page (`src/app/[locale]/modules/equipment-management/[id]/assign/page.tsx`)
- Replaced `window.location.reload()` with `fetchAssignments()` calls
- Checks if data exists before fetching (`!equipment` and `assignments.length === 0`)

#### Rental Detail Page (`src/app/[locale]/modules/rental-management/[id]/page.tsx`)
- Replaced all `window.location.reload()` calls with `fetchRental()` calls
- All action handlers (generate quotation, approve, mobilize, activate, complete, generate invoice) now refresh data instead of reloading page

## Key Improvements

### Data Fetching
1. **Conditional Fetching**: Components check if data exists before fetching
2. **Cache Awareness**: Uses existing cache mechanisms where available
3. **Dependency Tracking**: Only refetches when dependencies actually change
4. **Tab-Based Lazy Loading**: Ready for implementation (hook created)

### Page Refreshes
1. **State Updates**: Replaced `window.location.reload()` with targeted data refreshes
2. **No Full Reloads**: Uses `router.refresh()` or specific fetch functions instead
3. **Smooth UX**: Users see immediate updates without page flicker

### Auto-Refresh Timers
1. **Smart Refresh**: Only refreshes data that already exists
2. **Initial Load Protection**: Prevents auto-refresh from triggering on initial page load
3. **Section-Based**: Only refreshes visible sections

## Files Modified

### Core Hooks
- `src/hooks/use-smart-fetch.ts` (NEW)
- `src/hooks/use-app-refresh.ts` (NEW)

### Pages
- `src/app/page.tsx`
- `src/app/[locale]/modules/project-management/[id]/page.tsx`
- `src/app/[locale]/modules/customer-management/[id]/page.tsx`
- `src/app/[locale]/modules/equipment-management/[id]/assign/page.tsx`
- `src/app/[locale]/modules/rental-management/[id]/page.tsx`

## Remaining Tasks

### Tab-Based Lazy Loading
The `useTabBasedFetch` hook is ready but needs to be integrated into pages with tabs:
- Rental detail page tabs (details, workflow, items, payments, invoices, report)
- Employee detail page tabs
- Project detail page tabs

### Additional Files with `window.location.reload()`
These files still have reload calls that could be optimized:
- `src/components/site-header.tsx`
- `src/app/[locale]/profile/page.tsx`
- `src/app/[locale]/modules/quotation-management/[id]/page.tsx`
- `src/app/[locale]/modules/quotation-management/page.tsx`
- `src/app/[locale]/modules/timesheet-management/[id]/page.tsx`
- `src/app/[locale]/modules/leave-management/[id]/page.tsx`
- `src/app/[locale]/modules/leave-management/[id]/edit/page.tsx`
- `src/app/[locale]/modules/user-management/page.tsx`
- `src/components/h2s-card/GenerateH2SCardButton.tsx`
- `src/components/rbac-initializer.tsx`
- `src/app/[locale]/modules/payroll-management/[id]/payslip/page.tsx`
- `src/contexts/sse-context.tsx` (system-level reloads may be intentional)

## Usage Examples

### Using Smart Fetch Hook
```typescript
const { data, loading, error, refetch } = useSmartFetch({
  fetchFn: () => fetch('/api/data').then(r => r.json()),
  cacheKey: 'my-data',
  cacheTTL: 300000, // 5 minutes
  currentData: existingData, // Skip fetch if exists
  dependencies: [id], // Only refetch when id changes
});
```

### Using Tab-Based Fetch
```typescript
const { data, loading, error } = useTabBasedFetch({
  tabs: {
    'details': () => fetch('/api/details').then(r => r.json()),
    'items': () => fetch('/api/items').then(r => r.json()),
  },
  activeTab: currentTab,
  cacheKey: 'rental-data',
});
```

### Using App Refresh Hook
```typescript
const { refreshData, updateAndRefresh } = useAppRefresh();

// After mutation
await updateAndRefresh(
  async () => {
    await fetch('/api/update', { method: 'POST' });
  },
  async () => {
    await fetchData(); // Refresh specific data
  }
);
```

## Benefits

1. **Performance**: Reduced unnecessary API calls and network requests
2. **User Experience**: Faster page loads, no page flicker on updates
3. **Bandwidth**: Less data transferred, especially on mobile
4. **Server Load**: Reduced server requests for already-loaded data
5. **State Management**: Better state preservation across navigation

## Next Steps

1. Integrate `useTabBasedFetch` into pages with tabs
2. Replace remaining `window.location.reload()` calls
3. Add loading states for smoother transitions
4. Consider implementing React Query for advanced caching (optional)

