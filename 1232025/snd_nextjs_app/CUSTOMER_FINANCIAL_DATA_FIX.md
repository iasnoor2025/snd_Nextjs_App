# Customer Financial Data - Improved Logging

## What Was Fixed

Added detailed logging to diagnose why invoice amounts are showing as 0:

1. **Log invoice field names** - See what fields ERPNext returns
2. **Log first invoice sample** - See actual data structure
3. **Log each invoice** - See individual invoice details
4. **Log parsed amounts** - See what we're extracting
5. **Log final totals** - See the calculated sums

## How to Check

1. Refresh customer detail page for "AKFA UNITED COMPANY LTD"
2. Open browser console (F12)
3. Look for these logs:
   - "📊 Sample invoice fields:" - Shows available fields
   - "📊 Sample invoice data:" - Shows actual invoice data
   - "📊 Invoice 1:", "Invoice 2:", etc. - Individual invoices
   - "📊 Parsed amounts" - What we extracted
   - "📊 Final totals" - Calculated sums

## Expected Results

If invoices have amounts:
- Should show actual grand_total values
- Should show outstanding amounts
- Total Invoices: 6 (already showing)
- Outstanding: Real amount (not 0)

If amounts are truly 0:
- Invoices exist but have no amounts
- This is actual ERPNext data
- Or invoices might be in draft/cancelled status

## What to Send

Please send the console logs showing:
1. "Sample invoice fields:" - List of field names
2. "Sample invoice data:" - First invoice object
3. Any "Parsed amounts" - What was extracted

This will help identify the correct field names to use.
