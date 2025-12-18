import { db } from '@/lib/drizzle';
import { systemSettings } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

export interface SettingValue {
  key: string;
  value: string | null;
  type: string;
  description?: string | null;
  category: string;
}

export class SettingsService {
  /**
   * Get a single setting by key
   */
  static async getSetting(key: string): Promise<string | null> {
    const result = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    return result[0]?.value || null;
  }

  /**
   * Get multiple settings by keys
   */
  static async getSettings(keys: string[]): Promise<Record<string, string | null>> {
    if (keys.length === 0) {
      return {};
    }

    const results = await db
      .select()
      .from(systemSettings)
      .where(
        sql`${systemSettings.key} = ANY(${keys})`
      );

    const settings: Record<string, string | null> = {};
    keys.forEach(key => {
      const setting = results.find(s => s.key === key);
      settings[key] = setting?.value || null;
    });

    return settings;
  }

  /**
   * Get all settings by category
   */
  static async getSettingsByCategory(category: string): Promise<SettingValue[]> {
    const results = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.category, category));

    return results.map(r => ({
      key: r.key,
      value: r.value,
      type: r.type || 'string',
      description: r.description,
      category: r.category || 'general',
    }));
  }

  /**
   * Get all public settings
   */
  static async getPublicSettings(): Promise<Record<string, string | null>> {
    const results = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.isPublic, true));

    const settings: Record<string, string | null> = {};
    results.forEach(r => {
      settings[r.key] = r.value;
    });

    return settings;
  }

  /**
   * Get all settings
   */
  static async getAllSettings(): Promise<SettingValue[]> {
    const results = await db
      .select()
      .from(systemSettings)
      .orderBy(systemSettings.category, systemSettings.key);

    return results.map(r => ({
      key: r.key,
      value: r.value,
      type: r.type || 'string',
      description: r.description,
      category: r.category || 'general',
    }));
  }

  /**
   * Set or update a setting
   */
  static async setSetting(
    key: string,
    value: string | null,
    options?: {
      type?: string;
      description?: string;
      category?: string;
      isPublic?: boolean;
    }
  ): Promise<void> {
    const existing = await db
      .select()
      .from(systemSettings)
      .where(eq(systemSettings.key, key))
      .limit(1);

    if (existing.length > 0) {
      // Update existing
      await db
        .update(systemSettings)
        .set({
          value,
          type: options?.type || existing[0].type || 'string',
          description: options?.description !== undefined ? options.description : existing[0].description,
          category: options?.category || existing[0].category || 'general',
          isPublic: options?.isPublic !== undefined ? options.isPublic : existing[0].isPublic,
          updatedAt: sql`CURRENT_DATE`,
        })
        .where(eq(systemSettings.key, key));
    } else {
      // Insert new
      await db.insert(systemSettings).values({
        key,
        value,
        type: options?.type || 'string',
        description: options?.description || null,
        category: options?.category || 'general',
        isPublic: options?.isPublic || false,
        updatedAt: sql`CURRENT_DATE`,
      });
    }
  }

  /**
   * Set multiple settings at once
   */
  static async setSettings(
    settings: Array<{
      key: string;
      value: string | null;
      type?: string;
      description?: string;
      category?: string;
      isPublic?: boolean;
    }>
  ): Promise<void> {
    for (const setting of settings) {
      await this.setSetting(setting.key, setting.value, {
        type: setting.type,
        description: setting.description,
        category: setting.category,
        isPublic: setting.isPublic,
      });
    }
  }

  /**
   * Delete a setting
   */
  static async deleteSetting(key: string): Promise<void> {
    await db
      .delete(systemSettings)
      .where(eq(systemSettings.key, key));
  }

  /**
   * Initialize default settings
   */
  static async initializeDefaults(): Promise<void> {
    const defaultSettings = [
      {
        key: 'company.name',
        value: 'SND Rental',
        type: 'string',
        description: 'Company name displayed throughout the application',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'company.logo',
        value: '/snd-logo.png',
        type: 'string',
        description: 'Company logo URL or path',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'company.email',
        value: '',
        type: 'string',
        description: 'Company contact email',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'company.phone',
        value: '',
        type: 'string',
        description: 'Company contact phone',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'company.address',
        value: '',
        type: 'string',
        description: 'Company address',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'app.name',
        value: 'SND Rental',
        type: 'string',
        description: 'Application name',
        category: 'app',
        isPublic: true,
      },
      // Currency Settings
      {
        key: 'currency.code',
        value: 'SAR',
        type: 'string',
        description: 'Currency code (e.g., SAR, USD, EUR)',
        category: 'financial',
        isPublic: true,
      },
      {
        key: 'currency.symbol',
        value: 'SAR',
        type: 'string',
        description: 'Currency symbol displayed in the application',
        category: 'financial',
        isPublic: true,
      },
      // Regional Settings
      {
        key: 'locale.timezone',
        value: 'Asia/Riyadh',
        type: 'string',
        description: 'Default timezone for the application',
        category: 'locale',
        isPublic: true,
      },
      {
        key: 'locale.dateFormat',
        value: 'YYYY-MM-DD',
        type: 'string',
        description: 'Default date format',
        category: 'locale',
        isPublic: true,
      },
      {
        key: 'locale.dateTimeFormat',
        value: 'YYYY-MM-DD HH:mm',
        type: 'string',
        description: 'Default date-time format',
        category: 'locale',
        isPublic: true,
      },
      // Financial Settings
      {
        key: 'financial.taxRate',
        value: '15',
        type: 'string',
        description: 'Default VAT/Tax rate percentage',
        category: 'financial',
        isPublic: false,
      },
      {
        key: 'financial.defaultPaymentTerms',
        value: '30',
        type: 'string',
        description: 'Default payment terms in days',
        category: 'financial',
        isPublic: false,
      },
      {
        key: 'financial.invoiceCompanyName',
        value: 'Samhan Naser Al-Dosri Est',
        type: 'string',
        description: 'Company name used in invoices and quotations',
        category: 'financial',
        isPublic: false,
      },
      // Application Settings
      {
        key: 'app.pagination.defaultPageSize',
        value: '20',
        type: 'string',
        description: 'Default number of items per page',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'app.pagination.maxPageSize',
        value: '100',
        type: 'string',
        description: 'Maximum number of items per page',
        category: 'app',
        isPublic: false,
      },
      // File Upload Settings
      {
        key: 'upload.maxFileSize',
        value: '10485760',
        type: 'string',
        description: 'Maximum file upload size in bytes (10MB = 10485760)',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'upload.allowedImageTypes',
        value: 'image/jpeg,image/jpg,image/png,image/gif,image/webp',
        type: 'string',
        description: 'Comma-separated list of allowed image MIME types',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'upload.allowedDocumentTypes',
        value: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        type: 'string',
        description: 'Comma-separated list of allowed document MIME types',
        category: 'app',
        isPublic: false,
      },
      // Social Media & Links
      {
        key: 'company.website',
        value: '',
        type: 'string',
        description: 'Company website URL',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'company.facebook',
        value: '',
        type: 'string',
        description: 'Facebook page URL',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'company.twitter',
        value: '',
        type: 'string',
        description: 'Twitter/X profile URL',
        category: 'company',
        isPublic: true,
      },
      {
        key: 'company.linkedin',
        value: '',
        type: 'string',
        description: 'LinkedIn company page URL',
        category: 'company',
        isPublic: true,
      },
      // Footer Settings
      {
        key: 'footer.copyright',
        value: '',
        type: 'string',
        description: 'Copyright text for footer',
        category: 'app',
        isPublic: true,
      },
      {
        key: 'footer.termsUrl',
        value: '',
        type: 'string',
        description: 'Terms of Service URL',
        category: 'app',
        isPublic: true,
      },
      {
        key: 'footer.privacyUrl',
        value: '',
        type: 'string',
        description: 'Privacy Policy URL',
        category: 'app',
        isPublic: true,
      },
      // Email Settings
      {
        key: 'email.fromAddress',
        value: 'noreply@snd.com',
        type: 'string',
        description: 'Default sender email address',
        category: 'email',
        isPublic: false,
      },
      {
        key: 'email.fromName',
        value: 'SND Rental Management',
        type: 'string',
        description: 'Default sender name for emails',
        category: 'email',
        isPublic: false,
      },
      {
        key: 'email.passwordResetExpiry',
        value: '3600',
        type: 'string',
        description: 'Password reset token expiry in seconds (default: 3600 = 1 hour)',
        category: 'email',
        isPublic: false,
      },
      // ERPNext Integration Settings
      {
        key: 'erpnext.priceList',
        value: 'Standard Selling',
        type: 'string',
        description: 'Default price list name for ERPNext invoices',
        category: 'integration',
        isPublic: false,
      },
      {
        key: 'erpnext.sellingPriceList',
        value: 'Standard Selling',
        type: 'string',
        description: 'Selling price list for ERPNext',
        category: 'integration',
        isPublic: false,
      },
      // Business Rules / Payroll Settings
      {
        key: 'payroll.defaultContractHours',
        value: '8',
        type: 'string',
        description: 'Default contract hours per day',
        category: 'payroll',
        isPublic: false,
      },
      {
        key: 'payroll.defaultContractDays',
        value: '30',
        type: 'string',
        description: 'Default contract days per month',
        category: 'payroll',
        isPublic: false,
      },
      {
        key: 'payroll.defaultOvertimeMultiplier',
        value: '1.5',
        type: 'string',
        description: 'Default overtime rate multiplier (e.g., 1.5 = 1.5x hourly rate)',
        category: 'payroll',
        isPublic: false,
      },
      {
        key: 'payroll.defaultOvertimeFixedRate',
        value: '6',
        type: 'string',
        description: 'Default fixed overtime rate per hour (used when multiplier is 0)',
        category: 'payroll',
        isPublic: false,
      },
      // Report Settings
      {
        key: 'report.defaultDateFormat',
        value: 'YYYY-MM-DD',
        type: 'string',
        description: 'Default date format for reports',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'report.includeLogo',
        value: 'true',
        type: 'string',
        description: 'Include company logo in reports (true/false)',
        category: 'app',
        isPublic: false,
      },
      // Cache Settings
      {
        key: 'cache.permissionsTTL',
        value: '86400000',
        type: 'string',
        description: 'Permissions cache TTL in milliseconds (default: 86400000 = 24 hours)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'cache.globalTTL',
        value: '600000',
        type: 'string',
        description: 'Global cache TTL in milliseconds (default: 600000 = 10 minutes)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'cache.sessionTTL',
        value: '1800000',
        type: 'string',
        description: 'Session cache TTL in milliseconds (default: 1800000 = 30 minutes)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'cache.userTTL',
        value: '900000',
        type: 'string',
        description: 'User cache TTL in milliseconds (default: 900000 = 15 minutes)',
        category: 'system',
        isPublic: false,
      },
      // Rate Limiting Settings
      {
        key: 'ratelimit.strict.window',
        value: '900000',
        type: 'string',
        description: 'Strict rate limit window in milliseconds (default: 900000 = 15 minutes)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'ratelimit.strict.maxRequests',
        value: '10',
        type: 'string',
        description: 'Strict rate limit max requests per window',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'ratelimit.standard.window',
        value: '900000',
        type: 'string',
        description: 'Standard rate limit window in milliseconds (default: 900000 = 15 minutes)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'ratelimit.standard.maxRequests',
        value: '100',
        type: 'string',
        description: 'Standard rate limit max requests per window',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'ratelimit.auth.window',
        value: '900000',
        type: 'string',
        description: 'Auth rate limit window in milliseconds (default: 900000 = 15 minutes)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'ratelimit.auth.maxRequests',
        value: '5',
        type: 'string',
        description: 'Auth rate limit max requests per window',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'ratelimit.upload.window',
        value: '3600000',
        type: 'string',
        description: 'Upload rate limit window in milliseconds (default: 3600000 = 1 hour)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'ratelimit.upload.maxRequests',
        value: '20',
        type: 'string',
        description: 'Upload rate limit max requests per window',
        category: 'system',
        isPublic: false,
      },
      // Display/Format Settings
      {
        key: 'display.numberFormat',
        value: 'en-US',
        type: 'string',
        description: 'Default number format locale (e.g., en-US, ar-SA)',
        category: 'locale',
        isPublic: true,
      },
      {
        key: 'display.currencyFormat',
        value: 'standard',
        type: 'string',
        description: 'Currency display format (standard, compact, etc.)',
        category: 'locale',
        isPublic: true,
      },
      {
        key: 'display.decimalPlaces',
        value: '2',
        type: 'string',
        description: 'Default number of decimal places for currency',
        category: 'locale',
        isPublic: true,
      },
      // Timesheet Settings
      {
        key: 'timesheet.autoApprove',
        value: 'false',
        type: 'string',
        description: 'Auto-approve timesheets after submission (true/false)',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'timesheet.allowEditAfterApproval',
        value: 'false',
        type: 'string',
        description: 'Allow editing timesheets after approval (true/false)',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'timesheet.submissionDeadline',
        value: '5',
        type: 'string',
        description: 'Days after month end to allow timesheet submission',
        category: 'app',
        isPublic: false,
      },
      // Invoice/Quotation Settings
      {
        key: 'invoice.defaultNotes',
        value: '',
        type: 'textarea',
        description: 'Default notes text for invoices',
        category: 'financial',
        isPublic: false,
      },
      {
        key: 'quotation.defaultTerms',
        value: '',
        type: 'textarea',
        description: 'Default terms and conditions for quotations',
        category: 'financial',
        isPublic: false,
      },
      // Security Settings
      {
        key: 'security.sessionTimeout',
        value: '86400000',
        type: 'string',
        description: 'Session timeout in milliseconds (default: 86400000 = 24 hours)',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'security.passwordMinLength',
        value: '6',
        type: 'string',
        description: 'Minimum password length',
        category: 'system',
        isPublic: false,
      },
      {
        key: 'security.requireStrongPassword',
        value: 'false',
        type: 'string',
        description: 'Require strong passwords (uppercase, lowercase, numbers, symbols)',
        category: 'system',
        isPublic: false,
      },
      // Notification Settings
      {
        key: 'notification.emailEnabled',
        value: 'true',
        type: 'string',
        description: 'Enable email notifications (true/false)',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'notification.smsEnabled',
        value: 'false',
        type: 'string',
        description: 'Enable SMS notifications (true/false)',
        category: 'app',
        isPublic: false,
      },
      {
        key: 'notification.pushEnabled',
        value: 'false',
        type: 'string',
        description: 'Enable push notifications (true/false)',
        category: 'app',
        isPublic: false,
      },
    ];

    await this.setSettings(defaultSettings);
  }
}

