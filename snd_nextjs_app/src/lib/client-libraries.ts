// Client-side library utilities with proper fallbacks
// This ensures these libraries are only loaded on the client side

export const loadHtml2Canvas = async () => {
  if (typeof window === 'undefined') {
    throw new Error('html2canvas can only be used on the client side');
  }
  
  try {
    const { default: html2canvas } = await import('html2canvas');
    return html2canvas;
  } catch (error) {
    console.error('Failed to load html2canvas:', error);
    throw new Error('Failed to load html2canvas library');
  }
};

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

export const loadReactToPrint = async () => {
  if (typeof window === 'undefined') {
    throw new Error('react-to-print can only be used on the client side');
  }
  
  try {
    const { useReactToPrint } = await import('react-to-print');
    return useReactToPrint;
  } catch (error) {
    console.error('Failed to load react-to-print:', error);
    throw new Error('Failed to load react-to-print library');
  }
};

// Check if we're on the client side
export const isClient = typeof window !== 'undefined';

// Safe wrapper for client-side operations
export const safeClientOperation = <T>(
  operation: () => T,
  fallback: T
): T => {
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
