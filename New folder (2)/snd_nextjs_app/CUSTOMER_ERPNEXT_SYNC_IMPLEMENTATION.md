# Customer ERPNext Bidirectional Sync Implementation

## Overview
This document outlines the implementation of bidirectional customer synchronization between the application and ERPNext.

## Implementation Details

### 1. ERPNext Client Extensions (`src/lib/erpnext-client.ts`)
Added two new methods for customer sync:

#### `createCustomer(customer: any): Promise<string | null>`
Creates a new customer in ERPNext with the following mappings:
- `customer_name` ← customer.name
- `customer_group` ← customer.customerGroup (default: 'Individual')
- `customer_type` ← customer.customerType (default: 'Company')
- `territory` ← customer.territory (default: 'All Territories')
- `company_name` ← customer.companyName
- `contact_person` ← customer.contactPerson
- `mobile_no` ← customer.phone
- `email_id` ← customer.email
- `website` ← customer.website
- `tax_id` ← customer.taxNumber
- `gstin` ← customer.vatNumber
- `credit_limit` ← customer.creditLimit
- `address_line1` ← customer.address
- `city` ← customer.city
- `state` ← customer.state
- `pincode` ← customer.postalCode
- `country` ← customer.country (default: 'Saudi Arabia')

Returns the ERPNext customer ID (name) on success.

#### `updateCustomer(customer: any): Promise<boolean>`
Updates an existing customer in ERPNext. If no erpnextId is provided, it creates the customer instead.
Uses the same field mappings as createCustomer.

### 2. Customer API Route Updates (`src/app/api/customers/route.ts`)

#### POST /api/customers (Create)
After successfully creating a customer locally:
1. Creates the customer in ERPNext
2. Updates the local record with the erpnextId returned from ERPNext
3. Handles ERPNext failures gracefully without blocking local creation
4. Invalidates the cache

#### PUT /api/customers (Update)
After successfully updating a customer locally:
1. Updates the customer in ERPNext
2. Handles ERPNext failures gracefully without blocking local updates
3. Invalidates the cache

### 3. Webhook for ERPNext → Local Sync
Already implemented at `src/app/api/webhooks/erpnext/customers/route.ts`

This webhook receives updates from ERPNext and:
- Creates new customers in the local database
- Updates existing customers based on ERPNext changes
- Marks customers as inactive when deleted in ERPNext
- Sends SSE notifications to connected clients

## Bidirectional Flow

### Local → ERPNext (Automatic - No Webhooks Required!)
```
User creates/updates customer in UI
    ↓
POST/PUT /api/customers
    ↓
Save to local database
    ↓
Automatically sync to ERPNext (create/update Customer)
    ↓
Update local record with erpnextId (if new)
```

### ERPNext → Local (Automatic - No Webhooks Required!)
```
Automatic sync runs every 15 minutes via cron job
    ↓
Fetch all customers from ERPNext
    ↓
Compare with local database
    ↓
Create/update customers in local database
    ↓
New customers appear automatically in Next.js app
```

**Note:** Changes from ERPNext appear in the app within 15 minutes automatically, no webhooks needed!

## Configuration

### Required Environment Variables
```env
NEXT_PUBLIC_ERPNEXT_URL=https://your-erpnext-instance.com
NEXT_PUBLIC_ERPNEXT_API_KEY=your_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_api_secret
APP_URL=https://your-app-url.com
NEXTAUTH_URL=https://your-app-url.com
```

### Automatic Sync (No Webhooks Needed!)
The system automatically syncs customers from ERPNext every 15 minutes via a cron job:
- Runs every 15 minutes: `*/15 * * * *`
- Automatically fetches all customers from ERPNext
- Creates or updates local customers
- No configuration needed - works automatically!

### Optional: ERPNext Webhook (For Real-Time Updates)
If you want instant updates (instead of 15-minute delay), you can optionally configure a webhook in ERPNext:

```
https://your-app-url.com/api/webhooks/erpnext/customers
```

The webhook should trigger on:
- Customer creation (for instant sync instead of waiting 15 minutes)
- Customer update (for instant sync instead of waiting 15 minutes)  
- Customer deletion (optional, will mark as inactive)

**Note:** Webhooks are OPTIONAL - the automatic 15-minute sync already handles everything!

## Field Mappings

| Local Field | ERPNext Field | Notes |
|------------|---------------|-------|
| name | customer_name | |
| companyName | company_name | |
| contactPerson | contact_person | |
| email | email_id | |
| phone | mobile_no | |
| address | address_line1 | |
| city | city | |
| state | state | |
| postalCode | pincode | |
| country | country | Default: 'Saudi Arabia' |
| website | website | |
| taxNumber | tax_id | |
| vatNumber | gstin | |
| creditLimit | credit_limit | Numeric |
| customerGroup | customer_group | Default: 'Individual' |
| customerType | customer_type | Default: 'Company' |
| territory | territory | Default: 'All Territories' |
| language | language | Default: 'en' |

## Error Handling

- **ERPNext unavailable**: Local operations continue normally, sync fails silently
- **Invalid data**: Synchronization is skipped, local operation continues
- **Authentication failures**: Logged but don't block local operations
- **Network errors**: Logged and retried (in future: implement retry queue)

## Testing

### Test Local → ERPNext Sync
1. Create a customer via the UI
2. Check ERPNext for the new customer
3. Verify erpnextId is set in the local database

### Test ERPNext → Local Sync
1. Create/update a customer in ERPNext
2. Webhook should update local database
3. Check UI for the updated customer

### Test Bidirectional Sync
1. Create customer locally → syncs to ERPNext
2. Update in ERPNext → syncs back to local
3. Update locally → syncs to ERPNext

## Automatic Sync Schedule

The cron job runs customer sync from ERPNext automatically:

| Schedule | Description |
|----------|-------------|
| Every 15 minutes | Automatic customer sync from ERPNext → Next.js app |

This ensures that:
- New customers created in ERPNext appear in the app within 15 minutes
- Updates from ERPNext are reflected in the app within 15 minutes
- No manual intervention or webhooks required
- Works automatically in the background

## Known Limitations

1. Sync delay of up to 15 minutes from ERPNext → Next.js (can be reduced to 5 minutes or made real-time with webhooks)
2. No conflict resolution for simultaneous edits
3. Address fields are stored on Customer document, not Address child table
4. No retry mechanism for failed syncs
5. Currency and payment terms need additional implementation

## Manual Sync (For Testing)

You can manually trigger a customer sync from ERPNext:

```bash
# Manual sync API endpoint
curl -X POST https://your-app-url.com/api/customers/sync/enhanced \
  -H "Content-Type: application/json"
```

This will:
- Fetch all customers from ERPNext
- Create any new customers in your local database
- Update existing customers with latest data from ERPNext
- Return a summary of what was synced

## Future Enhancements

1. Reduce sync interval from 15 minutes to 5 minutes or 1 minute
2. Implement retry queue for failed syncs
3. Add conflict detection and resolution
4. Implement proper Address child table support in ERPNext
5. Add sync status indicators in the UI
6. Add manual "Sync Now" button for customers in the UI
7. Log all sync operations for auditing
8. Add real-time sync using SSE or WebSockets
