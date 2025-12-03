# ERPNext Sync Documentation

## Overview

This document describes the automatic ERPNext synchronization functionality that keeps employee data in sync between the local application and ERPNext system.

## Features

### Automatic Sync on Employee Operations

The system now automatically syncs employee data to ERPNext when:

1. **Creating a new employee** - Employee is created in ERPNext with all relevant data
2. **Updating an existing employee** - Changes (including file number changes) are synced to ERPNext
3. **Deleting an employee** - Employee is marked as inactive in ERPNext

### What Gets Synced

The following employee data is automatically synced to ERPNext:

- **Basic Information**: First name, middle name, last name, employee number (file number)
- **Contact Details**: Email, phone, address, city, state, country
- **Employment Details**: Department, designation, hire date, status
- **Salary Information**: Basic salary, allowances, overtime rates
- **Personal Information**: Date of birth, nationality, gender
- **Legal Documents**: IQAMA number, passport number, various licenses
- **Bank Information**: Bank name, account number, IBAN

## How It Works

### 1. Service Architecture

The sync functionality is implemented through a centralized `ERPNextSyncService` class that:

- Manages ERPNext client connections
- Handles all sync operations
- Provides consistent error handling
- Logs all sync activities

### 2. Automatic Triggers

Sync is automatically triggered by:

- **POST** `/api/employees` - New employee creation
- **PUT** `/api/employees/[id]` - Employee updates
- **DELETE** `/api/employees/[id]` - Employee deletion (soft delete)

### 3. Sync Process

1. **Local Operation**: Employee data is first saved/updated in the local database
2. **Sync Preparation**: Employee data is formatted for ERPNext API
3. **ERPNext Sync**: Data is sent to ERPNext via API calls
4. **Result Handling**: Sync results are logged and returned to the client
5. **ID Mapping**: For new employees, the ERPNext ID is stored locally

## Configuration

### Environment Variables

The following environment variables must be configured for ERPNext sync to work:

```bash
NEXT_PUBLIC_ERPNEXT_URL=https://your-erpnext-instance.com
NEXT_PUBLIC_ERPNEXT_API_KEY=your_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_api_secret
```

### Testing Configuration

You can test if ERPNext sync is properly configured by calling:

```
GET /api/test-erpnext-sync
```

This endpoint will return the configuration status and availability of the ERPNext sync service.

## API Response Format

All employee operations now include ERPNext sync results in their responses:

```json
{
  "success": true,
  "message": "Employee updated successfully",
  "employee": { ... },
  "erpnextSync": {
    "success": true,
    "message": "ERPNext sync completed successfully"
  }
}
```

## Error Handling

### Sync Failures

If ERPNext sync fails:

- The local operation (create/update/delete) still succeeds
- Sync errors are logged for debugging
- The response includes sync failure details
- The application continues to function normally

### Common Error Scenarios

1. **Network Issues**: ERPNext server unreachable
2. **Authentication Errors**: Invalid API credentials
3. **Data Validation**: ERPNext rejects invalid data
4. **Rate Limiting**: Too many API calls

## File Number Changes

### Special Handling

When an employee's file number changes:

1. **Local Update**: File number is updated in the local database
2. **ERPNext Sync**: The change is automatically synced to ERPNext
3. **Data Consistency**: Both systems maintain the same file number
4. **Audit Trail**: All changes are logged and tracked

### Benefits

- **Real-time Sync**: Changes are reflected immediately in both systems
- **Data Integrity**: No manual intervention required
- **Error Prevention**: Reduces data inconsistencies between systems
- **Audit Compliance**: Complete tracking of all changes

## Monitoring and Logging

### Console Logs

All sync operations are logged to the console:

```
ERPNext sync successful for employee 12345
ERPNext sync failed for employee 12346
ERPNext sync error for employee 12347: Network timeout
```

### Response Tracking

Each API response includes sync status, making it easy to:

- Monitor sync success rates
- Debug sync failures
- Track data consistency
- Audit system performance

## Best Practices

### 1. Environment Configuration

- Always use environment variables for ERPNext credentials
- Never hardcode API keys in the source code
- Use different credentials for development and production

### 2. Error Handling

- Monitor sync failure rates
- Set up alerts for repeated sync failures
- Review logs regularly for sync issues

### 3. Data Validation

- Ensure employee data meets ERPNext requirements
- Validate file numbers before sync
- Handle edge cases gracefully

### 4. Performance

- Sync operations are asynchronous and don't block user operations
- Large datasets are processed in batches
- Rate limiting is respected to avoid overwhelming ERPNext

## Troubleshooting

### Common Issues

1. **Sync Not Working**
   - Check environment variables
   - Verify ERPNext server accessibility
   - Check API credentials

2. **Sync Failures**
   - Review console logs for error details
   - Check ERPNext server status
   - Verify data format requirements

3. **Performance Issues**
   - Monitor API response times
   - Check network connectivity
   - Review ERPNext server performance

### Debug Endpoints

- `/api/test-erpnext-sync` - Test service availability
- `/api/employees/sync` - Manual sync trigger
- Console logs - Detailed sync information

## Future Enhancements

### Planned Features

1. **Retry Mechanism**: Automatic retry for failed syncs
2. **Batch Processing**: Bulk sync operations
3. **Sync Queue**: Queue-based sync for high-volume operations
4. **Webhook Support**: Real-time sync triggers
5. **Conflict Resolution**: Handle data conflicts between systems

### Integration Points

- **Notification System**: Alert users of sync status
- **Dashboard Metrics**: Sync success/failure statistics
- **Admin Interface**: Manual sync controls
- **Audit Reports**: Comprehensive sync history
