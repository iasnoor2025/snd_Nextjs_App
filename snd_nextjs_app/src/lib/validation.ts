// Basic input validation utilities - non-breaking, safe additions

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || typeof email !== 'string') {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate phone number (flexible format)
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  
  if (!phone || typeof phone !== 'string') {
    errors.push('Phone is required');
    return { isValid: false, errors };
  }

  // Remove common phone formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\+]/g, '');
  
  // Check if it contains only digits and is reasonable length
  if (!/^\d{7,15}$/.test(cleaned)) {
    errors.push('Invalid phone number format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required string field
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    errors.push(`${fieldName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize string input - removes potential XSS
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/**
 * Validate and sanitize object inputs
 */
export function validateAndSanitize<T extends Record<string, any>>(
  data: T,
  rules: Record<keyof T, (value: any) => ValidationResult>
): { isValid: boolean; data: T; errors: string[] } {
  const errors: string[] = [];
  const sanitized = { ...data };

  for (const [key, validateFn] of Object.entries(rules)) {
    const result = validateFn(data[key]);
    if (!result.isValid) {
      errors.push(...result.errors);
    }
    
    // Sanitize string values
    if (typeof sanitized[key] === 'string') {
      sanitized[key] = sanitizeString(sanitized[key]) as T[keyof T];
    }
  }

  return {
    isValid: errors.length === 0,
    data: sanitized,
    errors,
  };
}

/**
 * Validate ID parameter from URL
 */
export function validateId(id: string | undefined): ValidationResult {
  const errors: string[] = [];
  
  if (!id) {
    errors.push('ID is required');
    return { isValid: false, errors };
  }

  const numId = parseInt(id, 10);
  if (isNaN(numId) || numId <= 0) {
    errors.push('Invalid ID format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

