# Real-Time Customer Sync with ERPNext

This document explains how to set up and use the real-time customer synchronization system between ERPNext and your Next.js application.

## Overview

The real-time sync system automatically synchronizes customer data changes from ERPNext to your local database using webhooks. When a customer is created, updated, or deleted in ERPNext, the changes are immediately reflected in your application.

## Features

- **Real-time synchronization**: Changes in ERPNext are automatically synced
- **Webhook-based**: Uses ERPNext webhooks for instant notifications
- **SSE notifications**: Real-time updates sent to connected users
- **Auto-sync**: Automatic synchronization when changes are detected
- **Manual sync**: Manual sync button for immediate synchronization
- **Visual indicators**: Shows when updates are available

## Architecture

```
ERPNext → Webhook → Next.js API → Database Update → SSE → Frontend Notification
```

1. **ERPNext**: Triggers webhook on customer changes
2. **Webhook Endpoint**: Receives and processes customer data
3. **Database Update**: Updates local customer database
4. **SSE Notification**: Sends real-time updates to frontend
5. **Frontend**: Shows notifications and updates UI

## Setup Instructions

### 1. ERPNext Webhook Configuration

In your ERPNext instance:

1. Go to **Setup > Integrations > Webhooks**
2. Click **New** to create a new webhook
3. Configure the webhook with these settings:

   - **Webhook DocType**: `Customer`
   - **Webhook URL**: `https://your-domain.com/api/webhooks/erpnext/customers`
   - **Webhook Events**: 
     - `after_insert` (when customer is created)
     - `after_update` (when customer is updated)
     - `after_delete` (when customer is deleted)
   - **Webhook Data**: `All`
   - **Request Structure**: `Form URL-Encoded`
   - **Enable Security**: `No` (for testing, enable for production)

4. **Save** the webhook

### 2. Environment Variables

Ensure these environment variables are set in your `.env.local`:

```bash
NEXT_PUBLIC_ERPNEXT_URL=https://your-erpnext-instance.com
NEXT_PUBLIC_ERPNEXT_API_KEY=your_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_api_secret
APP_URL=https://your-domain.com
```

### 3. Webhook Endpoint

The webhook endpoint is automatically available at:
```
POST /api/webhooks/erpnext/customers
```

This endpoint:
- Receives customer data from ERPNext
- Maps ERPNext fields to your database schema
- Updates or creates customers in your database
- Sends SSE notifications to connected users

## Usage

### Automatic Sync

Once configured, the system automatically:
- Receives webhook notifications from ERPNext
- Updates your local database
- Shows real-time notifications to users
- Updates the sync button to show available updates

### Manual Sync

Users can manually sync by clicking the sync button:
- **Normal state**: Shows refresh icon
- **Updates available**: Shows bell icon with "Updates Available" text
- **Syncing**: Shows loading spinner

### Webhook Management

Use the Webhook Manager in the ERPNext Integration settings to:
- View webhook status
- Test webhook connectivity
- Get setup instructions
- Reconfigure webhooks

## API Endpoints

### Webhook Endpoints

- `POST /api/webhooks/erpnext/customers` - Receives customer webhooks
- `GET /api/webhooks/erpnext/customers` - Webhook status check

### Setup Endpoints

- `GET /api/webhooks/erpnext/setup` - Get webhook information
- `POST /api/webhooks/erpnext/setup` - Setup webhooks in ERPNext

### Sync Endpoints

- `POST /api/customers/sync/enhanced` - Enhanced customer sync
- `POST /api/customers/sync` - Basic customer sync

## Data Mapping

The system automatically maps ERPNext customer fields to your database schema:

| ERPNext Field | Database Field | Notes |
|---------------|----------------|-------|
| `name` | `name` | Customer name |
| `customer_name` | `name` | Alternative name field |
| `company_name` | `companyName` | Company name |
| `contact_person` | `contactPerson` | Contact person |
| `email_id` | `email` | Email address |
| `mobile_no` | `phone` | Phone number |
| `primary_address` | `address` | Address (HTML cleaned) |
| `city` | `city` | City |
| `state` | `state` | State/Province |
| `country` | `country` | Country |
| `tax_id` | `taxNumber` | Tax number |
| `credit_limit` | `creditLimit` | Credit limit |
| `currency` | `currency` | Default currency (SAR) |

## Testing

### Test Webhook Setup

1. Go to **Settings > ERPNext Integration > Customers**
2. Click **Test Webhook** to verify connectivity
3. Create/update a customer in ERPNext
4. Check if the change appears in your application

### Test Manual Sync

1. Click the **Sync from ERPNext** button
2. Verify that customer data is synchronized
3. Check the sync status and counts

## Troubleshooting

### Common Issues

1. **Webhook not receiving data**
   - Check ERPNext webhook configuration
   - Verify webhook URL is accessible
   - Check ERPNext logs for webhook errors

2. **Data not syncing**
   - Verify API credentials
   - Check database connection
   - Review API response logs

3. **SSE notifications not working**
   - Check SSE endpoint connectivity
   - Verify frontend event listeners
   - Check browser console for errors

### Debug Steps

1. Check ERPNext webhook logs
2. Monitor webhook endpoint logs
3. Verify database updates
4. Check SSE connection status
5. Review frontend console logs

## Security Considerations

### Production Deployment

1. **Enable webhook security** in ERPNext
2. **Implement webhook signature verification**
3. **Use HTTPS** for all webhook communications
4. **Restrict webhook access** to trusted sources
5. **Monitor webhook usage** and logs

### Webhook Verification

Consider implementing webhook signature verification:

```typescript
// In webhook endpoint
const signature = request.headers.get('x-erpnext-signature');
const payload = await request.text();
const expectedSignature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');

if (signature !== expectedSignature) {
  return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
}
```

## Performance Optimization

### Database Operations

- Use batch operations for multiple updates
- Implement connection pooling
- Add database indexes for frequently queried fields

### Webhook Processing

- Process webhooks asynchronously
- Implement retry logic for failed webhooks
- Queue webhook processing for high-volume scenarios

### SSE Optimization

- Limit concurrent SSE connections
- Implement connection timeouts
- Use connection pooling for SSE

## Monitoring

### Key Metrics

- Webhook success/failure rates
- Sync operation performance
- Database update times
- SSE connection counts
- User notification delivery rates

### Logging

Enable detailed logging for:
- Webhook requests and responses
- Database operations
- SSE connections and events
- Error conditions and stack traces

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review ERPNext and application logs
3. Verify configuration settings
4. Test webhook connectivity
5. Contact system administrator
