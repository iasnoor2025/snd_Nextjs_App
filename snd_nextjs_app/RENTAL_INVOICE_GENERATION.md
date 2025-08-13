# Rental Invoice Generation System

This document describes the rental invoice generation system that integrates with ERPNext to create and manage invoices for equipment rentals.

## Overview

The system provides a complete workflow for generating invoices from rentals:
1. **Invoice Generation**: Creates invoices in ERPNext and updates local rental records
2. **PDF Generation**: Generates downloadable PDF invoices
3. **ERPNext Integration**: Syncs invoice data with ERPNext system
4. **UI Integration**: Provides buttons and workflows in the rental management interface

## API Endpoints

### 1. Generate Invoice
**POST** `/api/rentals/[id]/invoice`

Generates an invoice for a rental in ERPNext and updates the local rental record.

**Request Body**: None required

**Response**:
```json
{
  "success": true,
  "message": "Invoice generated successfully",
  "data": {
    "invoiceId": "ACC-SINV-.YYYY.-00001",
    "invoiceNumber": "INV-ABC-1234567",
    "invoiceDate": "2024-01-15",
    "paymentDueDate": "2024-02-14",
    "erpnextInvoice": { ... }
  }
}
```

**Error Responses**:
- `400`: Rental cannot have invoice generated (cancelled/draft status, invoice already exists)
- `404`: Rental not found
- `500`: Server error during invoice generation

### 2. Download Invoice PDF
**GET** `/api/rentals/[id]/invoice/download`

Downloads the generated invoice as a PDF file.

**Response**: PDF file with appropriate headers

**Error Responses**:
- `400`: No invoice found for rental
- `404`: Rental not found
- `500`: Server error during PDF generation

### 3. Test ERPNext Connection
**GET** `/api/erpnext/test-invoice-connection`

Tests the ERPNext connection and invoice creation capability.

**Response**:
```json
{
  "success": true,
  "message": "ERPNext connection and invoice creation test successful",
  "data": {
    "connection": "OK",
    "testInvoice": { ... }
  }
}
```

## Invoice Generation Process

### 1. Validation
- Checks if rental exists and is in valid status
- Ensures no invoice already exists
- Validates customer information and total amount

### 2. ERPNext Invoice Creation
- Generates unique invoice number
- Maps rental data to ERPNext Sales Invoice format
- Creates invoice in ERPNext system
- Returns ERPNext invoice ID

### 3. Local Record Update
- Updates rental with invoice information
- Sets invoice date and payment due date
- Updates rental status to 'active'
- Sets payment status to 'pending'

## ERPNext Integration

### Invoice Data Structure
```typescript
interface ERPNextInvoiceData {
  doctype: 'Sales Invoice';
  customer: string;
  customer_name?: string;
  posting_date: string;
  due_date: string;
  items: ERPNextInvoiceItem[];
  currency: 'SAR';
  company: 'C.A.T. INTERNATIONAL L.L.C.';
  // ... other fields
}
```

### Item Mapping
- **Equipment Items**: Maps rental items to invoice line items
- **Service Items**: Creates service line items for rentals without equipment
- **Pricing**: Uses unit price and total price from rental items
- **Quantities**: Defaults to 1 for equipment rentals

### Configuration
Required environment variables (same as employee sync):
```env
NEXT_PUBLIC_ERPNEXT_URL=https://erp.snd-ksa.online
NEXT_PUBLIC_ERPNEXT_API_KEY=your_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_api_secret
```

**Note**: The invoice service now uses the same environment variables as the working employee sync service, eliminating configuration mismatches.

## PDF Generation

### Invoice PDF Features
- Company header with logo
- Customer billing information
- Project details (if available)
- Rental items table
- Financial summary
- Payment terms
- Professional formatting

### PDF Download
- Generated on-demand
- Includes ERPNext invoice ID
- Professional invoice layout
- Downloadable format

## UI Integration

### Rental Timeline
The invoice generation is integrated into the rental workflow timeline:

1. **Quotation Generated** → Customer approval
2. **Quotation Approved** → Mobilization
3. **Mobilization** → Rental activation
4. **Active Rental** → Completion
5. **Completed** → **Invoice Generation** ← Current step
6. **Invoice Created** → Payment tracking

### Action Buttons
- **Generate Invoice**: Creates invoice when rental is completed
- **Download PDF**: Downloads invoice PDF after generation
- **View in ERPNext**: Opens invoice in ERPNext system

## Troubleshooting

### Common Error: "Failed to generate invoice"

This error typically occurs due to one of the following issues:

#### 1. Environment Variables Not Set
**Problem**: Missing or incorrect ERPNext configuration
**Solution**: Check your `.env.local` file contains:
```env
NEXT_PUBLIC_ERPNEXT_URL=https://erp.snd-ksa.online
NEXT_PUBLIC_ERPNEXT_API_KEY=your_actual_api_key
NEXT_PUBLIC_ERPNEXT_API_SECRET=your_actual_api_secret
```

**Important**: The invoice service now uses the **same environment variables** as the working employee sync service. No need for duplicate `ERPNEXT_API_KEY` variables.

**Test**: Visit `/api/erpnext/test-invoice-connection` to verify configuration

**Recent Fix**: Previously, the invoice service used different environment variable names (`ERPNEXT_API_KEY`) than the employee sync service (`NEXT_PUBLIC_ERPNEXT_API_KEY`), causing connection failures. This has been resolved by unifying the configuration.

#### 2. ERPNext Server Unreachable
**Problem**: Network connectivity or server issues
**Symptoms**: Connection timeouts or network errors
**Solutions**:
- Verify ERPNext server is running and accessible
- Check firewall settings
- Test network connectivity to ERPNext URL

#### 3. Invalid API Credentials
**Problem**: Wrong API key or secret
**Symptoms**: 401 Unauthorized errors
**Solutions**:
- Verify API key and secret in ERPNext
- Check API key permissions (needs Sales Invoice create access)
- Regenerate API credentials if necessary

#### 4. Missing ERPNext Configuration
**Problem**: ERPNext not properly configured for invoices
**Symptoms**: 400 Bad Request or validation errors
**Solutions**:
- Ensure Sales Invoice doctype exists in ERPNext
- Verify company settings are configured
- Check currency and tax settings

#### 5. Rental Data Issues
**Problem**: Invalid rental data preventing invoice creation
**Symptoms**: Validation errors in logs
**Solutions**:
- Ensure rental has valid customer information
- Verify total amount is greater than 0
- Check rental status allows invoice generation

### Debug Steps

#### Step 1: Check Environment Variables
```bash
# In your .env.local file, verify:
NEXT_PUBLIC_ERPNEXT_URL=https://erp.snd-ksa.online
ERPNEXT_API_KEY=your_api_key_here
ERPNEXT_API_SECRET=your_api_secret_here
```

#### Step 2: Test ERPNext Connection
Visit: `http://localhost:3000/api/erpnext/test-invoice-connection`

Expected response:
```json
{
  "success": true,
  "message": "ERPNext connection and invoice creation test successful"
}
```

#### Step 3: Check Browser Console
Look for detailed error messages with emojis:
- 🔧 Configuration Check
- 🌐 ERPNext Request URLs
- 📤 Request Headers
- 📥 Response Status
- ❌ Error Details

#### Step 4: Check Server Logs
Look for detailed logging in your terminal/console:
```
🚀 Starting invoice generation for rental: 123
📋 Rental details: { id: 123, customerName: "Customer Name", ... }
🔧 ERPNext Configuration Check:
  - URL: ✅ Set
  - API Key: ✅ Set
  - API Secret: ✅ Set
🌐 Making ERPNext request to: https://erp.snd-ksa.online/api/resource/Sales Invoice
```

#### Step 5: Verify ERPNext Setup
1. **Login to ERPNext** and verify you can create Sales Invoices manually
2. **Check API Key permissions** - needs "Sales Invoice" create access
3. **Verify company settings** - company name should match "C.A.T. INTERNATIONAL L.L.C."
4. **Check currency settings** - should support "SAR"

### Error Recovery

#### Configuration Errors
```bash
# Regenerate ERPNext API credentials
1. Go to ERPNext > Setup > Integrations > API Access
2. Create new API Key/Secret
3. Update .env.local file
4. Restart Next.js server
```

#### Network Errors
```bash
# Test connectivity
curl -I https://erp.snd-ksa.online
ping erp.snd-ksa.online

# Check firewall settings
# Verify VPN connection if required
```

#### Data Validation Errors
```bash
# Check rental data in database
# Verify customer exists and has required fields
# Ensure rental amounts are valid numbers
```

## Testing

### Test Scenarios
1. **Valid Rental**: Complete rental with customer and items
2. **Missing Data**: Rental without customer information
3. **Duplicate Invoice**: Attempt to generate second invoice
4. **ERPNext Failure**: Network or authentication issues
5. **PDF Generation**: Download and verify PDF format

### Test Commands
```bash
# Test ERPNext connection
curl http://localhost:3000/api/erpnext/test-invoice-connection

# Test invoice generation
curl -X POST http://localhost:3000/api/rentals/1/invoice

# Test PDF download
curl http://localhost:3000/api/rentals/1/invoice/download -o test-invoice.pdf
```