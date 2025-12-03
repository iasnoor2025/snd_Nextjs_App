# How to Check Customer Data in ERPNext

## Step 1: Check Local Database

The customer "AKFA UNITED COMPANY LTD" exists in your local database with:
- **ID:** 21
- **Name:** AKFA UNITED COMPANY LTD
- **Email:** INFO@AKTAUNITEA.COM
- **ERPNext ID:** AKFA UNITED COMPANY LTD (this is the key!)

## Step 2: Check ERPNext Data

I've created an API endpoint to check if this customer has data in ERPNext:

### Method 1: Via API Endpoint

Open your browser and go to:
```
http://localhost:3000/api/customers/check-erpnext?name=AKFA UNITED COMPANY LTD
```

This will show:
- If customer exists in local database
- If customer has erpnextId
- Financial data from ERPNext (invoices, outstanding, etc.)

### Method 2: Direct Browser Check

Just go to the customer detail page and open browser console (F12). You'll see logs showing:
```
📊 Fetching stats for customer ID: 21
📊 Customer found: AKFA UNITED COMPANY LTD
📊 Fetching customer financial data from ERPNext: AKFA UNITED COMPANY LTD
📊 Customer financial data from ERPNext: { ... }
```

## Step 3: Expected Results

If the customer has data in ERPNext, you'll see:
- **Total Invoices:** Actual count from ERPNext
- **Outstanding:** Real outstanding amount
- **Current Due:** Actual due amount
- **Total Value:** Lifetime value from ERPNext
- **Credit Limit:** Real credit limit from ERPNext

If there's no data in ERPNext, you'll see zeros (which is correct if there truly is no data).

## What I've Implemented

### 1. ERPNext Client Method
Added `getCustomerFinancialData()` to fetch:
- Customer record from ERPNext
- All Sales Invoices for the customer
- Calculate totals and outstanding amounts

### 2. Stats API Enhancement
Updated `/api/customers/[id]/stats` to:
- Fetch ERPNext financial data if customer has erpnextId
- Merge ERPNext data with local rental data
- Return combined statistics

### 3. Check API Endpoint
Created `/api/customers/check-erpnext` to:
- Check if customer exists in local DB
- Check if customer has erpnextId
- Fetch and return ERPNext financial data

## How to Verify

1. Go to customer detail page for "AKFA UNITED COMPANY LTD"
2. Open browser console (F12)
3. Look for logs starting with "📊"
4. Check if financial data is shown

## Current Status

**Customer Found:**
- ✅ Exists in local database (ID: 21)
- ✅ Has erpnextId: "AKFA UNITED COMPANY LTD"
- ✅ Will fetch data from ERPNext automatically

**Next Steps:**
1. Refresh the customer detail page
2. Check browser console for ERPNext fetch logs
3. Verify that data is displayed (not zeros)

## If Still Showing Zeros

If you're still seeing zeros, it means:

1. **ERPNext doesn't have this customer** - OR
2. **Customer exists in ERPNext but has no invoices** - OR  
3. **ERPNext connection is not working**

To diagnose:
1. Check browser console for errors
2. Verify ERPNext environment variables are set
3. Try accessing ERPNext directly to confirm customer exists there

## Quick Test

Run this in your browser console on the customer detail page:
```javascript
fetch('/api/customers/21/stats')
  .then(r => r.json())
  .then(data => console.log('Stats:', data.stats, 'ERPNext:', data.erpnextFinancialData));
```

This will show you exactly what data is being fetched.
