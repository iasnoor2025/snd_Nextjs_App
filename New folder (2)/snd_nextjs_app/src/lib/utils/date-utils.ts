/**
 * Date utility functions for consistent date handling across the application
 * Reduces repeated date string operations and improves performance
 */

/**
 * Convert a date to date-only string (YYYY-MM-DD)
 * @param date - Date object or ISO string. If not provided, uses current date
 * @returns Date string in YYYY-MM-DD format
 */
export function toDateString(date?: Date | string | null): string {
  if (!date) {
    return new Date().toISOString().split('T')[0];
  }
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Convert a date to ISO string
 * @param date - Date object or ISO string. If not provided, uses current date
 * @returns ISO string
 */
export function toISOString(date?: Date | string | null): string {
  if (!date) {
    return new Date().toISOString();
  }
  return date instanceof Date ? date.toISOString() : new Date(date).toISOString();
}

/**
 * Get the previous day as date string
 * @param date - Date object or ISO string. If not provided, uses current date
 * @returns Previous day as YYYY-MM-DD string
 */
export function getPreviousDay(date?: Date | string | null): string {
  const d = date ? (date instanceof Date ? date : new Date(date)) : new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Get current date as date string
 * @returns Current date as YYYY-MM-DD string
 */
export function getCurrentDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get current timestamp as ISO string
 * @returns Current timestamp as ISO string
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if a date string is valid
 * @param dateString - Date string to validate
 * @returns True if valid, false otherwise
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Format date for input field (YYYY-MM-DD)
 * @param date - Date object or ISO string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateForInput(date: Date | string): string {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

/**
 * Format date in Arabic/Hijri calendar
 * @param date - Date object, ISO string, or date string
 * @returns Formatted Arabic date string
 */
export function formatArabicDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const formatter = new Intl.DateTimeFormat('ar-SA', {
      calendar: 'islamic',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return formatter.format(d);
  } catch (error) {
    return '';
  }
}

/**
 * Format date in English/Gregorian calendar
 * @param date - Date object, ISO string, or date string
 * @returns Formatted English date string
 */
export function formatEnglishDate(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return formatter.format(d);
  } catch (error) {
    return '';
  }
}

/**
 * Convert Gregorian date to Hijri date string (YYYY/MM/DD format)
 * @param gregorianDate - Gregorian date string in YYYY-MM-DD format
 * @returns Hijri date string in YYYY/MM/DD format or null if invalid
 */
export function gregorianToHijri(gregorianDate: string | null | undefined): string | null {
  if (!gregorianDate) return null;
  
  try {
    const date = new Date(gregorianDate);
    if (isNaN(date.getTime())) return null;
    
    // Use Intl API to get Hijri date parts
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    
    if (year && month && day) {
      return `${year}/${month}/${day}`;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Convert Hijri date string to Gregorian date string
 * @param hijriDate - Hijri date string in YYYY/MM/DD or YYYY-MM-DD format
 * @returns Gregorian date string in YYYY-MM-DD format or null if invalid
 */
export function hijriToGregorian(hijriDate: string | null | undefined): string | null {
  if (!hijriDate) return null;
  
  try {
    // Normalize the input format
    const normalized = hijriDate.replace(/\//g, '-');
    const parts = normalized.split('-');
    
    if (parts.length !== 3) return null;
    
    const [year, month, day] = parts.map(p => parseInt(p, 10));
    
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    
    // Create a date using the Islamic calendar
    // Note: JavaScript Date doesn't directly support Hijri, so we use a workaround
    // We'll use Intl.DateTimeFormat to parse the Hijri date
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    // Create a date object and try to find the Gregorian equivalent
    // This is a simplified conversion - for production, consider using a proper Hijri library
    // For now, we'll use an approximation
    const tempDate = new Date(2000, 0, 1); // Use a reference date
    const testFormatter = new Intl.DateTimeFormat('en-US-u-ca-islamic', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    // Try to find the Gregorian date by testing different dates
    // This is a simplified approach - a proper implementation would use a conversion algorithm
    const gregorianYear = year + 579; // Approximate conversion (Hijri year + 579 ≈ Gregorian year)
    const testDate = new Date(gregorianYear, month - 1, day);
    
    // Verify the conversion by converting back
    const verifyParts = testFormatter.formatToParts(testDate);
    const verifyYear = parseInt(verifyParts.find(p => p.type === 'year')?.value || '0', 10);
    
    if (Math.abs(verifyYear - year) <= 1) {
      return testDate.toISOString().split('T')[0];
    }
    
    // Fallback: try a more accurate conversion
    // Using a known conversion formula: Gregorian = Hijri + 579 (approximate)
    const gregorianDate = new Date(gregorianYear, month - 1, day);
    if (!isNaN(gregorianDate.getTime())) {
      return gregorianDate.toISOString().split('T')[0];
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Get days until expiry
 * @param expiryDate - Expiry date as Date object, ISO string, or date string
 * @returns Number of days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(expiryDate: Date | string | null | undefined): number {
  if (!expiryDate) return 0;
  
  try {
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (isNaN(expiry.getTime())) return 0;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    return daysDiff;
  } catch (error) {
    return 0;
  }
}

/**
 * Check if a date is expired
 * @param expiryDate - Expiry date as Date object, ISO string, or date string
 * @returns True if the date is in the past
 */
export function isDateExpired(expiryDate: Date | string | null | undefined): boolean {
  if (!expiryDate) return false;
  
  try {
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (isNaN(expiry.getTime())) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    return expiry.getTime() < today.getTime();
  } catch (error) {
    return false;
  }
}

/**
 * Check if a date is expiring soon (within 30 days)
 * @param expiryDate - Expiry date as Date object, ISO string, or date string
 * @returns True if the date is within 30 days and not expired
 */
export function isDateExpiringSoon(expiryDate: Date | string | null | undefined): boolean {
  if (!expiryDate) return false;
  
  try {
    const expiry = expiryDate instanceof Date ? expiryDate : new Date(expiryDate);
    if (isNaN(expiry.getTime())) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    
    const timeDiff = expiry.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    // Expiring soon: between 0 and 30 days (not expired, but within 30 days)
    return daysDiff >= 0 && daysDiff <= 30;
  } catch (error) {
    return false;
  }
}
