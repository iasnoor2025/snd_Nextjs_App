/**
 * Utility functions for equipment management
 */

/**
 * Extracts door number from equipment name
 * Examples:
 * - "LOADER 1886 AAA" -> "1886"
 * - "1301-DOZER" -> "1301"
 * - "EXCAVATOR 2500" -> "2500"
 * - "CRANE-1500-LIFT" -> "1500"
 * - "BULLDOZER 999" -> "999"
 */
export function extractDoorNumberFromName(equipmentName: string): string | null {
  if (!equipmentName || typeof equipmentName !== 'string') {
    return null;
  }

  // Remove extra spaces and normalize
  const normalizedName = equipmentName.trim().replace(/\s+/g, ' ');
  
  // Pattern 1: Number followed by dash and text (e.g., "1301-DOZER")
  const dashPattern = /^(\d+)-/;
  const dashMatch = normalizedName.match(dashPattern);
  if (dashMatch) {
    return dashMatch[1] || null;
  }

  // Pattern 2: Text followed by number (e.g., "LOADER 1886 AAA", "LOADER 1886-AAA")
  const spacePattern = /\s(\d+)(?:\s|$|-)/;
  const spaceMatch = normalizedName.match(spacePattern);
  if (spaceMatch) {
    return spaceMatch[1] || null;
  }

  // Pattern 3: Number in the middle with dashes (e.g., "CRANE-1500-LIFT")
  const middlePattern = /-(\d+)-/;
  const middleMatch = normalizedName.match(middlePattern);
  if (middleMatch) {
    return middleMatch[1] || null;
  }

  // Pattern 4: Number at the end (e.g., "BULLDOZER 999")
  const endPattern = /\s(\d+)$/;
  const endMatch = normalizedName.match(endPattern);
  if (endMatch) {
    return endMatch[1] || null;
  }

  // Pattern 5: Number at the beginning (e.g., "1886 LOADER")
  const startPattern = /^(\d+)\s/;
  const startMatch = normalizedName.match(startPattern);
  if (startMatch) {
    return startMatch[1] || null;
  }

  return null;
}

/**
 * Validates if a door number is in the expected format
 * Door numbers should be numeric and reasonable length
 */
export function validateDoorNumber(doorNumber: string): boolean {
  if (!doorNumber || typeof doorNumber !== 'string') {
    return false;
  }

  // Must be numeric
  if (!/^\d+$/.test(doorNumber)) {
    return false;
  }

  // Must be reasonable length (1-6 digits)
  if (doorNumber.length < 1 || doorNumber.length > 6) {
    return false;
  }

  // Must not be all zeros
  if (doorNumber === '0' || doorNumber === '00' || doorNumber === '000') {
    return false;
  }

  return true;
}

/**
 * Auto-extract door number from equipment name if not provided
 * Returns the extracted door number or null if not found/invalid
 */
export function autoExtractDoorNumber(equipmentName: string, existingDoorNumber?: string | null): string | null {
  // If door number already exists and is valid, keep it
  if (existingDoorNumber && validateDoorNumber(existingDoorNumber)) {
    return existingDoorNumber;
  }

  // Extract from name
  const extracted = extractDoorNumberFromName(equipmentName);
  
  // Validate the extracted number
  if (extracted && validateDoorNumber(extracted)) {
    return extracted;
  }

  return null;
}
