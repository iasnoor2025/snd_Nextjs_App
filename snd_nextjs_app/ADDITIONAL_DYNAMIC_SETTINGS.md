# Additional Dynamic Settings Added

## Summary
I've added more dynamic settings to make your application fully configurable. Here's what was added:

## New Settings Categories

### 1. Email Settings
- **email.fromAddress** - Default sender email address (default: noreply@snd.com)
- **email.fromName** - Default sender name for emails (default: SND Rental Management)
- **email.passwordResetExpiry** - Password reset token expiry in seconds (default: 3600 = 1 hour)

### 2. Integration Settings (ERPNext)
- **erpnext.priceList** - Default price list name for ERPNext invoices (default: Standard Selling)
- **erpnext.sellingPriceList** - Selling price list for ERPNext (default: Standard Selling)

### 3. Payroll Settings (Business Rules)
- **payroll.defaultContractHours** - Default contract hours per day (default: 8)
- **payroll.defaultContractDays** - Default contract days per month (default: 30)
- **payroll.defaultOvertimeMultiplier** - Default overtime rate multiplier (default: 1.5 = 1.5x hourly rate)
- **payroll.defaultOvertimeFixedRate** - Default fixed overtime rate per hour (default: 6)

### 4. Report Settings
- **report.defaultDateFormat** - Default date format for reports (default: YYYY-MM-DD)
- **report.includeLogo** - Include company logo in reports (default: true)

## Complete Settings List

### Company Settings (9 settings)
- Company name, logo, email, phone, address
- Website, Facebook, Twitter, LinkedIn

### Financial Settings (5 settings)
- Currency code and symbol
- Tax rate, payment terms
- Invoice company name

### Regional Settings (3 settings)
- Timezone, date format, date-time format

### Application Settings (8 settings)
- App name, pagination, file upload limits
- Footer settings (copyright, terms, privacy)

### Email Settings (3 settings)
- From address, from name, password reset expiry

### Integration Settings (2 settings)
- ERPNext price list settings

### Payroll Settings (4 settings)
- Contract hours/days, overtime rates

### Report Settings (2 settings)
- Date format, logo inclusion

**Total: 36 configurable settings**

## Settings Page Tabs

The settings page now has 7 tabs:
1. **Company** - Company information and branding
2. **Financial** - Currency, tax, payment terms
3. **Regional** - Timezone and date formats
4. **Application** - App preferences and upload limits
5. **Email** - Email sender and notification settings
6. **Integration** - ERPNext and external system settings
7. **Payroll** - Default payroll calculation rules
8. **Other** - Any additional settings

## Next Steps to Use These Settings

### 1. Replace Email Hardcoded Values
```typescript
// In src/lib/email.ts
const fromEmail = await SettingsService.getSetting('email.fromAddress') || process.env.FROM_EMAIL || 'noreply@snd.com';
const fromName = await SettingsService.getSetting('email.fromName') || 'SND Rental Management';
const expirySeconds = parseInt(await SettingsService.getSetting('email.passwordResetExpiry') || '3600');
```

### 2. Replace ERPNext Hardcoded Values
```typescript
// In src/lib/services/erpnext-invoice-service.ts
const priceList = await SettingsService.getSetting('erpnext.priceList') || 'Standard Selling';
const companyName = await SettingsService.getSetting('financial.invoiceCompanyName') || 'Samhan Naser Al-Dosri Est';
```

### 3. Replace Payroll Hardcoded Values
```typescript
// In payroll generation services
const defaultContractHours = parseInt(await SettingsService.getSetting('payroll.defaultContractHours') || '8');
const defaultOvertimeMultiplier = parseFloat(await SettingsService.getSetting('payroll.defaultOvertimeMultiplier') || '1.5');
```

### 4. Replace Report Settings
```typescript
// In report generation services
const dateFormat = await SettingsService.getSetting('report.defaultDateFormat') || 'YYYY-MM-DD';
const includeLogo = (await SettingsService.getSetting('report.includeLogo') || 'true') === 'true';
```

## Benefits

✅ **No code changes needed** - Update settings through UI
✅ **Easy customization** - Change company info, currency, timezone without deployment
✅ **Business rule flexibility** - Adjust payroll rules, payment terms as needed
✅ **Multi-tenant ready** - Different settings for different companies/environments
✅ **Centralized configuration** - All settings in one place

## Access Control

- **Settings Page**: SUPER_ADMIN only
- **Public Settings**: Company info, currency, timezone, date formats (accessible without auth)
- **Private Settings**: Financial, email, integration, payroll settings (require authentication)

