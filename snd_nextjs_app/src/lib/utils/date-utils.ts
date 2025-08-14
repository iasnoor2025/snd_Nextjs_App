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
