/**
 * Utility functions for date operations
 */

/**
 * Check if a date is expired (past the current date)
 * @param dateString - Date string to check
 * @returns boolean indicating if the date is expired
 */
export function isDateExpired(dateString: string | Date): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

/**
 * Check if a date is expiring soon (within the next 30 days)
 * @param dateString - Date string to check
 * @returns boolean indicating if the date is expiring soon
 */
export function isDateExpiringSoon(dateString: string | Date): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  thirtyDaysFromNow.setHours(0, 0, 0, 0);

  return date >= today && date <= thirtyDaysFromNow;
}

/**
 * Get the number of days until a date expires
 * @param dateString - Date string to check
 * @returns number of days until expiry (negative if expired)
 */
export function getDaysUntilExpiry(dateString: string | Date): number {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();

  // Reset time to compare only dates
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format a date for display with expiry status
 * @param dateString - Date string to format
 * @returns formatted date string with expiry indicator
 */
export function formatDateWithExpiryStatus(dateString: string | Date): string {
  if (!dateString) return 'Not specified';

  const date = new Date(dateString);
  const isExpired = isDateExpired(dateString);
  const isExpiringSoon = isDateExpiringSoon(dateString);

  let prefix = '';
  if (isExpired) {
    prefix = 'EXPIRED: ';
  } else if (isExpiringSoon) {
    const daysLeft = getDaysUntilExpiry(dateString);
    prefix = `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}: `;
  } else {
    prefix = 'Expires: ';
  }

  return prefix + date.toLocaleDateString();
}

/**
 * Format a date in Arabic (Hijri) calendar
 * @param dateString - Date string to format
 * @returns formatted Hijri date string
 */
export function formatArabicDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'غير محدد';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'تاريخ غير صحيح';
    
    // Format using Islamic calendar (Hijri)
    const formatter = new Intl.DateTimeFormat('ar-SA', {
      calendar: 'islamic',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting Arabic date:', error);
    return 'تاريخ غير صحيح';
  }
}

/**
 * Format a date in English (Gregorian) calendar
 * @param dateString - Date string to format
 * @returns formatted Gregorian date string
 */
export function formatEnglishDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return 'Not specified';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    
    // Format using Gregorian calendar
    const formatter = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting English date:', error);
    return 'Invalid date';
  }
}

/**
 * Convert Gregorian date to Hijri date string (for input field)
 * @param dateString - Gregorian date string (YYYY-MM-DD format)
 * @returns Hijri date string in format YYYY/MM/DD
 */
export function gregorianToHijri(dateString: string | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    // Use Intl API to format as Hijri
    const formatter = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      calendar: 'islamic',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    
    const parts = formatter.formatToParts(date);
    const year = parts.find(p => p.type === 'year')?.value || '';
    const month = parts.find(p => p.type === 'month')?.value || '';
    const day = parts.find(p => p.type === 'day')?.value || '';
    
    return `${year}/${month}/${day}`;
  } catch (error) {
    console.error('Error converting to Hijri:', error);
    return '';
  }
}

/**
 * Convert Hijri date string to Gregorian date string
 * @param hijriDateString - Hijri date string in format YYYY/MM/DD or YYYY-MM-DD
 * @returns Gregorian date string in format YYYY-MM-DD
 */
export function hijriToGregorian(hijriDateString: string | null | undefined): string {
  if (!hijriDateString) return '';
  
  try {
    // Parse Hijri date (format: YYYY/MM/DD or YYYY-MM-DD)
    const normalized = hijriDateString.replace(/\//g, '-');
    const parts = normalized.split('-');
    
    if (parts.length !== 3) return '';
    
    const hijriYear = parseInt(parts[0], 10);
    const hijriMonth = parseInt(parts[1], 10);
    const hijriDay = parseInt(parts[2], 10);
    
    if (isNaN(hijriYear) || isNaN(hijriMonth) || isNaN(hijriDay)) return '';
    
    // Validate ranges
    if (hijriMonth < 1 || hijriMonth > 12 || hijriDay < 1 || hijriDay > 30) return '';
    
    // Use a more accurate conversion algorithm
    // Reference: 1 Muharram 1440 AH = September 11, 2018 CE
    const referenceHijri = { year: 1440, month: 1, day: 1 };
    const referenceGregorian = new Date(2018, 8, 11); // Month is 0-indexed, so 8 = September
    
    // Calculate the difference in Hijri days
    // Hijri months alternate between 29 and 30 days
    let hijriDaysFromRef = 0;
    
    // Add years (each Hijri year has approximately 354.37 days)
    const yearDiff = hijriYear - referenceHijri.year;
    hijriDaysFromRef += Math.floor(yearDiff * 354.367);
    
    // Add months (approximate)
    const monthDiff = hijriMonth - referenceHijri.month;
    // Average month length in Hijri calendar is about 29.53 days
    hijriDaysFromRef += Math.floor(monthDiff * 29.53);
    
    // Add days
    hijriDaysFromRef += hijriDay - referenceHijri.day;
    
    // Convert to Gregorian date
    const gregorianDate = new Date(referenceGregorian);
    gregorianDate.setDate(gregorianDate.getDate() + Math.round(hijriDaysFromRef));
    
    // Verify the conversion by checking if we can convert back
    // This helps ensure accuracy
    const verificationHijri = gregorianToHijri(
      `${gregorianDate.getFullYear()}-${String(gregorianDate.getMonth() + 1).padStart(2, '0')}-${String(gregorianDate.getDate()).padStart(2, '0')}`
    );
    
    // If verification is close enough (within 2 days), use it
    const verificationParts = verificationHijri.split('/');
    if (verificationParts.length === 3) {
      const verYear = parseInt(verificationParts[0], 10);
      const verMonth = parseInt(verificationParts[1], 10);
      const verDay = parseInt(verificationParts[2], 10);
      
      // If the converted date is close, use it; otherwise adjust
      const dayDiff = Math.abs(verDay - hijriDay);
      if (dayDiff > 2) {
        // Adjust by the difference
        gregorianDate.setDate(gregorianDate.getDate() + (hijriDay - verDay));
      }
    }
    
    // Format as YYYY-MM-DD
    const year = gregorianDate.getFullYear();
    const month = String(gregorianDate.getMonth() + 1).padStart(2, '0');
    const day = String(gregorianDate.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error converting from Hijri:', error);
    return '';
  }
}

/**
 * Format date for HTML date input (YYYY-MM-DD)
 * @param dateString - Date string or Date object
 * @returns Formatted date string for date input
 */
export function formatDateForInput(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error('Error formatting date for input:', error);
    return '';
  }
}