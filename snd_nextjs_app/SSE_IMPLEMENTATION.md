# SSE (Server-Sent Events) Implementation

This document describes the comprehensive SSE implementation for real-time communication in the SND Rental Management System.

## Overview

The SSE implementation provides real-time event streaming for the rental management system, enabling live updates for:
- Rental status changes
- Payment notifications
- Equipment maintenance alerts
- Employee timesheet updates
- Payroll processing notifications
- System-wide notifications
- Sync progress updates

## Architecture

### 1. Server-Side (API Routes)

#### `/api/sse` - Main SSE Endpoint
- **GET**: Establishes SSE connection and streams events
- **POST**: Broadcasts events to all connected clients
- **Features**:
  - Connection management with automatic cleanup
  - Heartbeat mechanism (30-second intervals)
  - Event broadcasting to all connected clients
  - Error handling and logging

### 2. Client-Side (React Hooks & Context)

#### `useSSE` Hook
- Manages SSE connection lifecycle
- Handles reconnection logic
- Provides event filtering
- Toast notifications for events
- Page visibility handling

#### `SSEProvider` Context
- Global SSE state management
- Event history tracking
- Connection controls
- Event broadcasting utilities

### 3. Components

#### `SSEStatus` Component
- Visual connection status indicator
- Connection controls (connect/disconnect/reconnect)
- Event history display
- Error reporting

#### `SSEStatusCompact` Component
- Compact status for headers/toolbars
- Minimal visual indicator

## Features

### Connection Management
- **Automatic Reconnection**: Attempts to reconnect on connection loss
- **Page Refresh Handling**: Properly reconnects after page refreshes
- **Visibility API**: Handles app backgrounding/foregrounding
- **Cleanup**: Proper resource cleanup on unmount

### Event Types
```typescript
type SSEEventType = 
  | 'rental_status_updated'
  | 'payment_received'
  | 'maintenance_required'
  | 'rental_overdue'
  | 'equipment_location_updated'
  | 'timesheet_updated'
  | 'payroll_processed'
  | 'leave_request_updated'
  | 'system_notification'
  | 'sync_progress';
```

### Event Filtering
- Filter events by type using `eventTypes` option
- Custom event handlers via `onEvent` callback
- Toast notification control via `showToasts` option

### Error Handling
- Connection error detection and reporting
- Automatic retry with exponential backoff
- User-friendly error messages
- Graceful degradation

## Usage

### Basic Usage

```typescript
import { useSSE } from '@/hooks/use-sse';

function MyComponent() {
  const { isConnected, lastEvent, events } = useSSE({
    enabled: true,
    showToasts: true,
    eventTypes: ['rental_status_updated', 'payment_received']
  });

  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {lastEvent && <p>Last event: {lastEvent.type}</p>}
    </div>
  );
}
```

### Using SSE Context

```typescript
import { useSSEContext, useRentalEvents } from '@/contexts/sse-context';

function RentalDashboard() {
  const { isConnected, sendEvent } = useSSEContext();
  const rentalEvents = useRentalEvents();

  const handleStatusUpdate = async () => {
    await sendEvent('rental_status_updated', {
      rental_id: 123,
      status: 'completed'
    });
  };

  return (
    <div>
      <SSEStatusCompact />
      <button onClick={handleStatusUpdate}>Update Status</button>
    </div>
  );
}
```

### Broadcasting Events

```typescript
import { SSEEvents } from '@/lib/sse-utils';

// Predefined events
await SSEEvents.rentalStatusUpdated(123, 'active', 'John Doe');
await SSEEvents.paymentReceived(123, 1500, 'credit_card');
await SSEEvents.maintenanceRequired('Excavator XC-200', 'Engine maintenance due');

// Custom events
await createCustomEvent('rental_status_updated', {
  rental_id: 123,
  status: 'completed',
  notes: 'Equipment returned in good condition'
});
```

## Configuration

### Environment Variables
No additional environment variables required - SSE uses the same domain as the Next.js app.

### Provider Configuration
```typescript
<SSEProvider 
  enabled={true} 
  maxEvents={100} 
  showToasts={true}
>
  {children}
</SSEProvider>
```

## Testing

### Test Page
Visit `/sse-test` to:
- Monitor connection status
- Send test events
- View event history
- Test different event types

### Manual Testing
1. Open multiple browser tabs
2. Navigate to `/sse-test`
3. Send events from one tab
4. Verify events appear in other tabs

## Performance Considerations

### Connection Limits
- Browser limit: 6 concurrent connections per domain
- Server handles unlimited connections (memory permitting)
- Automatic cleanup of disconnected clients

### Memory Management
- Event history limited to 100 events by default
- Automatic cleanup of old events
- Connection cleanup on page unload

### Network Optimization
- Heartbeat every 30 seconds to keep connections alive
- Automatic reconnection with exponential backoff
- Connection pooling for multiple tabs

## Troubleshooting

### Common Issues

1. **Connection Fails**
   - Check if `/api/sse` endpoint is accessible
   - Verify CORS settings
   - Check browser console for errors

2. **Events Not Received**
   - Verify connection status
   - Check event type filtering
   - Ensure event data format is correct

3. **Memory Leaks**
   - Ensure proper cleanup in useEffect
   - Check for multiple SSE connections
   - Verify provider unmounting

### Debug Mode
Enable debug logging by setting:
```typescript
// In browser console
localStorage.setItem('sse-debug', 'true');
```

## Integration with Existing Features

### Dashboard Integration
- SSE status indicator in dashboard header
- Real-time updates for key metrics
- Live activity feed

### Module Integration
- Rental management: Status updates, payment notifications
- Equipment management: Location tracking, maintenance alerts
- Employee management: Timesheet updates, payroll notifications
- Customer management: Sync progress, status changes

### Future Enhancements
- WebSocket fallback for better performance
- Event persistence for offline scenarios
- Advanced filtering and subscription management
- Mobile push notification integration

## Security Considerations

### Authentication
- SSE connections inherit session authentication
- No additional authentication required
- Session-based access control

### Rate Limiting
- Consider implementing rate limiting for event broadcasting
- Monitor connection count and memory usage
- Implement connection limits if needed

### Data Validation
- Validate event data before broadcasting
- Sanitize user input in event data
- Implement event schema validation

## Monitoring

### Connection Metrics
- Active connection count
- Event broadcast success rate
- Connection error frequency
- Memory usage per connection

### Event Metrics
- Events per second
- Event type distribution
- Failed event broadcasts
- Event processing latency

## Best Practices

1. **Use Event Filtering**: Only listen to relevant events
2. **Handle Errors Gracefully**: Implement proper error handling
3. **Clean Up Resources**: Always clean up connections
4. **Test Thoroughly**: Test with multiple tabs and network conditions
5. **Monitor Performance**: Watch for memory leaks and connection issues
6. **Provide Fallbacks**: Implement polling for critical updates

## Migration from WebSocket

If migrating from WebSocket implementation:
1. Replace WebSocket connections with SSE
2. Update event handling logic
3. Test reconnection behavior
4. Verify event delivery reliability
5. Update documentation and examples

This SSE implementation provides a robust, scalable solution for real-time communication in the rental management system with proper error handling, reconnection logic, and comprehensive monitoring capabilities. 