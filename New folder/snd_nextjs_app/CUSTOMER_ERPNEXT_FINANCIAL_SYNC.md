# Customer ERPNext Financial Data Sync

## Overview
The customer detail page now fetches and displays real financial data from ERPNext including Current Due, Total Invoices, Outstanding amounts, and other financial values.

## Implementation

### 1. ERPNext Client - Fetch Financial Data
**File:** `src/lib/erpnext-client.ts`

Added new method `getCustomerFinancialData()` that:
- Fetches customer details from ERPNext
- Retrieves all sales invoices for the customer
- Calculates invoice statistics (total count, total invoiced)
- Calculates outstanding amounts from ERPNext invoices
- Returns credit limit and usage information

```typescript
async getCustomerFinancialData(erpnextCustomerName: string): Promise<any>
```

**Returns:**
- `outstandingAmount` - Outstanding amount from ERPNext
- `totalValue` - Total value from customer record
- `totalInvoiced` - Sum of all invoice amounts
- `totalInvoices` - Count of invoices
- `currentDue` - Current due amount
- `creditLimit` - Credit limit from ERPNext
- `creditLimitUsed` - How much credit is being used

### 2. Updated Stats API
**File:** `src/app/api/customers/[id]/stats/route.ts`

**Changes:**
- Fetches local rental data from database
- If customer has `erpnextId`, fetches financial data from ERPNext
- Merges ERPNext data with local data
- ERPNext data takes precedence for financial metrics

**Data Priority:**
1. **ERPNext data** (if available) - For invoices, outstanding, credit limits
2. **Local rental data** - For rental counts and amounts
3. **Combined** - Total value combines both sources

### 3. Customer Detail Page
**File:** `src/app/[locale]/modules/customer-management/[id]/page.tsx`

**Now Displays:**
- **Total Invoices** - From ERPNext (Sales Invoice count)
- **Outstanding** - From ERPNext invoices
- **Current Due** - Outstanding amount from ERPNext
- **Total Value** - From ERPNext customer record
- **Credit Limit** - From ERPNext
- **Credit Limit Remaining** - Calculated from ERPNext data

## Data Flow

```
Customer Detail Page Loads
    ↓
GET /api/customers/[id]/stats
    ↓
Stats API:
    1. Fetch customer from local DB
    2. Fetch rental stats from local DB
    3. If customer.erpnextId exists:
       → Fetch financial data from ERPNext
       → Fetch customer record from ERPNext
       → Fetch all sales invoices for customer
       → Calculate totals and outstanding
    4. Merge ERPNext data with local data
    5. Return combined stats
    ↓
Display on page:
  - Real invoice counts from ERPNext
  - Real outstanding amounts from ERPNext
  - Real current due from ERPNext
  - Real credit limits from ERPNext
```

## Features

### Financial Metrics from ERPNext
- **Total Invoices:** Actual count of sales invoices
- **Total Invoiced:** Sum of all invoice amounts
- **Outstanding:** Outstanding amount from unpaid invoices
- **Current Due:** Current due amount
- **Total Value:** Lifetime value from ERPNext
- **Credit Limit:** Credit limit from ERPNext
- **Credit Limit Used:** Outstanding amount (credit usage)
- **Credit Limit Remaining:** Available credit

### Local Rental Data
- **Total Rentals:** Count of rentals from local database
- **Total Rental Value:** Sum of rental amounts
- **Rental History:** List of all rentals for this customer

## Benefits

1. **Real Data:** Shows actual financial data from ERPNext
2. **No Zeros:** Displays meaningful values instead of zeros
3. **Automatic:** Updates every time page is refreshed
4. **Combined:** Merges local rental data with ERPNext financials
5. **Accurate:** Uses official ERPNext invoice data

## Configuration

### Required Environment Variables
```env
NEXT_PUBLIC_ERPNEXT_URL=https://your-erpnext-instance.com
NEXT_PUBLIC_ERPNEXT_API_KEY=your_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_api_secret
```

### Customer Setup
The customer must have an `erpnextId` field populated for ERPNext data to be fetched.

## API Endpoints

### Get Customer Stats with ERPNext Data
```bash
GET /api/customers/[id]/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "customerId": 21,
    "customerName": "AKFA UNITED COMPANY LTD",
    "totalRentals": 0,
    "totalInvoices": 15,
    "totalInvoiced": 150000.00,
    "outstandingAmount": 50000.00,
    "currentDue": 50000.00,
    "totalValue": 150000.00,
    "creditLimit": 200000.00,
    "creditLimitUsed": 50000.00,
    "creditLimitRemaining": 150000.00
  },
  "rentals": [],
  "erpnextFinancialData": {
    "outstandingAmount": 50000.00,
    "totalValue": 150000.00,
    "totalInvoices": 15,
    "totalInvoiced": 150000.00
  }
}
```

## Testing

### Verify ERPNext Data is Displayed
1. Navigate to customer detail page
2. Check browser console for logs:
   - "Fetching customer financial data from ERPNext: [customer name]"
   - "Customer financial data from ERPNext: [data]"
   - "ERPNext financial data: [merged data]"
3. Verify that financial metrics show ERPNext data instead of zeros

### Check ERPNext Integration
1. Ensure customer has an `erpnextId` in database
2. Ensure ERPNext environment variables are set
3. Ensure ERPNext API is accessible
4. Refresh customer detail page
5. Data should now show from ERPNext

## Error Handling

- **ERPNext unavailable:** Falls back to local data only
- **Customer not in ERPNext:** Shows local data only
- **API errors:** Logged but don't block page load
- **Graceful degradation:** Page still loads with available data

## Notes

- ERPNext data is fetched in real-time on each page load
- No caching applied to ensure fresh data
- Local rental data is always included regardless of ERPNext
- ERPNext financials take precedence when available
- Page shows "0" if customer genuinely has no data in either system
