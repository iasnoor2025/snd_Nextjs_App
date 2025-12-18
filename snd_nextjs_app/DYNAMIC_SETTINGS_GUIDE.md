# Dynamic Settings Implementation Guide

## Overview
This document outlines all the dynamic settings that can be configured through the Settings page (accessible only to SUPER_ADMIN users).

## Settings Categories

### 1. Company Settings
- **company.name** - Company name displayed throughout the application
- **company.logo** - Company logo URL or path
- **company.email** - Company contact email
- **company.phone** - Company contact phone
- **company.address** - Company address
- **company.website** - Company website URL
- **company.facebook** - Facebook page URL
- **company.twitter** - Twitter/X profile URL
- **company.linkedin** - LinkedIn company page URL

### 2. Financial Settings
- **currency.code** - Currency code (e.g., SAR, USD, EUR)
- **currency.symbol** - Currency symbol displayed in the application
- **financial.taxRate** - Default VAT/Tax rate percentage
- **financial.defaultPaymentTerms** - Default payment terms in days
- **financial.invoiceCompanyName** - Company name used in invoices and quotations

### 3. Regional/Locale Settings
- **locale.timezone** - Default timezone for the application (e.g., Asia/Riyadh)
- **locale.dateFormat** - Default date format (e.g., YYYY-MM-DD)
- **locale.dateTimeFormat** - Default date-time format (e.g., YYYY-MM-DD HH:mm)

### 4. Application Settings
- **app.name** - Application name
- **app.pagination.defaultPageSize** - Default number of items per page
- **app.pagination.maxPageSize** - Maximum number of items per page
- **upload.maxFileSize** - Maximum file upload size in bytes
- **upload.allowedImageTypes** - Comma-separated list of allowed image MIME types
- **upload.allowedDocumentTypes** - Comma-separated list of allowed document MIME types
- **footer.copyright** - Copyright text for footer
- **footer.termsUrl** - Terms of Service URL
- **footer.privacyUrl** - Privacy Policy URL

## Usage Examples

### Using Settings in Components

```typescript
import { useSettings } from '@/hooks/use-settings';

function MyComponent() {
  const { getSetting } = useSettings(['currency.symbol', 'locale.timezone']);
  const currency = getSetting('currency.symbol', 'SAR');
  const timezone = getSetting('locale.timezone', 'Asia/Riyadh');
  
  // Use the settings...
}
```

### Using Settings in Server Components/API Routes

```typescript
import { SettingsService } from '@/lib/services/settings-service';

// In API route or server component
const currency = await SettingsService.getSetting('currency.symbol') || 'SAR';
const taxRate = parseFloat(await SettingsService.getSetting('financial.taxRate') || '15');
```

## Next Steps for Full Implementation

To make the application fully dynamic, you should:

1. **Replace hardcoded currency values** - Search for 'SAR' and replace with settings
2. **Replace hardcoded timezone** - Search for 'Asia/Riyadh' and replace with settings
3. **Replace hardcoded company names** - Search for 'Samhan Naser Al-Dosri Est' and replace
4. **Replace hardcoded payment terms** - Search for '30' days and replace with settings
5. **Replace hardcoded tax rates** - Search for tax calculations and use settings
6. **Update file upload validation** - Use settings for max file size and allowed types
7. **Update pagination** - Use settings for default page sizes

## Helper Functions to Create

Consider creating helper functions in `src/lib/utils/settings-helpers.ts`:

```typescript
import { SettingsService } from '@/lib/services/settings-service';

export async function getCurrencySymbol(): Promise<string> {
  return await SettingsService.getSetting('currency.symbol') || 'SAR';
}

export async function getTaxRate(): Promise<number> {
  const rate = await SettingsService.getSetting('financial.taxRate');
  return rate ? parseFloat(rate) : 15;
}

export async function getTimezone(): Promise<string> {
  return await SettingsService.getSetting('locale.timezone') || 'Asia/Riyadh';
}

export async function getDefaultPaymentTerms(): Promise<number> {
  const terms = await SettingsService.getSetting('financial.defaultPaymentTerms');
  return terms ? parseInt(terms) : 30;
}
```

## Access Control

- **Settings Page**: Only accessible to SUPER_ADMIN users
- **Public Settings**: Company name, logo, email, phone, address, website, social links, currency, timezone, date formats, and footer info are public (can be accessed without authentication)
- **Private Settings**: Financial settings, upload limits, pagination settings are private (require authentication)

