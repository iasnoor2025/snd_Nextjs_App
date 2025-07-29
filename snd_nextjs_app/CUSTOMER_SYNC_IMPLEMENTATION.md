# Customer Sync Implementation

This document describes the implementation of customer synchronization between ERPNext and the Next.js Customer Management module.

## Overview

The customer sync functionality allows the Next.js application to fetch customers from ERPNext and store them locally in the database. This implementation mirrors the Laravel functionality but is adapted for the Next.js environment.

## Architecture

### Components

1. **API Endpoint**: `/api/customers/sync` - Handles the sync process
2. **Database Service**: Enhanced with sync methods
3. **UI Components**: Customer management page with sync button
4. **Mapping Logic**: Converts ERPNext fields to local database fields

### Data Flow

```
ERPNext API → Sync Endpoint → Database Service → Local Database
```

## Implementation Details

### 1. API Endpoint (`/api/customers/sync`)

**File**: `src/app/api/customers/sync/route.ts`

**Features**:
- Fetches all customers from ERPNext
- Maps ERPNext fields to local database fields
- Uses upsert operation to create or update customers
- Handles errors gracefully
- Provides detailed logging

**Key Functions**:
- `makeERPNextRequest()`: Handles ERPNext API communication
- `mapERPNextToLocal()`: Maps ERPNext fields to local schema
- `fetchAllCustomersFromERPNext()`: Fetches customer list from ERPNext

### 2. Database Service Updates

**File**: `src/lib/database.ts`

**Enhanced Methods**:
- `createCustomer()`: Updated to handle all customer fields
- `updateCustomer()`: Updated to handle all customer fields
- `syncCustomerFromERPNext()`: New method for ERPNext sync
- `getCustomerByERPNextId()`: New method to find customers by ERPNext ID

### 3. UI Integration

**File**: `src/app/modules/customer-management/page.tsx`

**Features**:
- Sync button with loading state
- Visual indicators for synced customers
- Sync status display
- Error handling with toast notifications

### 4. Customer Detail Page

**File**: `src/app/modules/customer-management/[id]/page.tsx`

**Features**:
- Displays ERPNext ID for synced customers
- Visual distinction between local and synced customers

## Field Mapping

### ERPNext to Local Database

| ERPNext Field | Local Field | Notes |
|---------------|-------------|-------|
| `customer_name` | `name` | Primary customer name |
| `customer_name` | `company_name` | Company name |
| `contact_person` | `contact_person` | Contact person name |
| `email_id` | `email` | Email address |
| `mobile_no` | `phone` | Phone number |
| `customer_address` | `address` | Primary address |
| `city` | `city` | City |
| `state` | `state` | State/Province |
| `pincode` | `postal_code` | Postal code |
| `country` | `country` | Country |
| `tax_id` | `tax_number` | Tax identification |
| `credit_limit` | `credit_limit` | Credit limit amount |
| `payment_terms` | `payment_terms` | Payment terms |
| `notes` | `notes` | Additional notes |
| `disabled` | `is_active` | Active status (inverted) |
| `name` | `erpnext_id` | ERPNext unique identifier |

## Configuration

### Environment Variables

Required environment variables for ERPNext integration:

```env
NEXT_PUBLIC_ERPNEXT_URL=https://your-erpnext-instance.com
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
```

### Database Schema

The customer table includes an `erpnext_id` field to track synced customers:

```sql
ALTER TABLE customers ADD COLUMN erpnext_id VARCHAR(255) UNIQUE;
```

## Usage

### Manual Sync

1. Navigate to Customer Management page
2. Click "Sync from ERPNext" button
3. Wait for sync to complete
4. View results in toast notification

### API Usage

```javascript
// Sync customers from ERPNext
const response = await fetch('/api/customers/sync', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});

const result = await response.json();
console.log(result);
// {
//   success: true,
//   message: "ERPNext Customer Sync complete. 25 customers processed.",
//   data: {
//     processed: 25,
//     created: 10,
//     updated: 15,
//     total: 25
//   }
// }
```

## Error Handling

### Common Errors

1. **Missing Configuration**: ERPNext environment variables not set
2. **Database Connection**: Database connection issues
3. **ERPNext API**: Network or authentication issues
4. **Data Mapping**: Invalid data from ERPNext

### Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

## Testing

### Test Script

Run the test script to verify functionality:

```bash
node scripts/test-customer-sync.js
```

### Manual Testing

1. Ensure ERPNext is accessible
2. Verify environment variables are set
3. Run sync from UI
4. Check database for synced customers
5. Verify customer details are correct

## Monitoring

### Logs

The sync process provides detailed logging:

- Database connection status
- ERPNext API responses
- Processing statistics
- Error details

### Metrics

Track sync performance:
- Number of customers processed
- Creation vs update counts
- Processing time
- Error rates

## Comparison with Laravel Implementation

### Similarities

- Same field mapping logic
- Same ERPNext API integration
- Same upsert strategy
- Same error handling approach

### Differences

- Next.js API routes vs Laravel controllers
- Prisma ORM vs Eloquent
- React UI vs Blade templates
- TypeScript vs PHP

## Future Enhancements

1. **Scheduled Sync**: Automatic periodic sync
2. **Incremental Sync**: Only sync changed records
3. **Bidirectional Sync**: Push changes back to ERPNext
4. **Conflict Resolution**: Handle data conflicts
5. **Audit Trail**: Track sync history
6. **Webhooks**: Real-time sync triggers

## Troubleshooting

### Common Issues

1. **Sync not working**: Check environment variables
2. **No customers synced**: Verify ERPNext API access
3. **Partial sync**: Check for data mapping issues
4. **Performance issues**: Consider batch processing

### Debug Steps

1. Check environment variables
2. Test ERPNext API directly
3. Verify database connection
4. Check API logs
5. Validate data mapping

## Security Considerations

1. **API Keys**: Store securely in environment variables
2. **Data Validation**: Validate all incoming data
3. **Rate Limiting**: Implement API rate limiting
4. **Access Control**: Ensure proper RBAC implementation
5. **Audit Logging**: Log all sync operations

## Performance Optimization

1. **Batch Processing**: Process customers in batches
2. **Parallel Requests**: Use concurrent API calls
3. **Caching**: Cache ERPNext responses
4. **Database Indexing**: Index frequently queried fields
5. **Connection Pooling**: Optimize database connections 