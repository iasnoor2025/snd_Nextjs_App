// Client-side library utilities with proper fallbacks
// This ensures these libraries are only loaded on the client side

export const loadJsPDF = async () => {
  if (typeof window === 'undefined') {
    throw new Error('jsPDF can only be used on the client side');
  }

  try {
    const { jsPDF } = await import('jspdf');
    return jsPDF;
  } catch (error) {
    console.error('Failed to load jsPDF:', error);
    throw new Error('Failed to load jsPDF library');
  }
};

// Check if we're on the client side
export const isClient = typeof window !== 'undefined';

// Safe wrapper for client-side operations
export const safeClientOperation = <T>(operation: () => T, fallback: T): T => {
  if (isClient) {
    try {
      return operation();
    } catch (error) {
      console.warn('Client operation failed, using fallback:', error);
      return fallback;
    }
  }
  return fallback;
};
