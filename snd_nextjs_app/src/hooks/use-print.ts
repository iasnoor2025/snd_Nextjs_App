import { useRef, useCallback } from "react";
import { toast } from "sonner";

interface UsePrintOptions {
  documentTitle?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  onPrintError?: (error: any) => void;
  waitForImages?: boolean;
}

export const usePrint = (options: UsePrintOptions = {}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const {
    documentTitle = "Document",
    onBeforePrint,
    onAfterPrint,
    onPrintError,
    waitForImages = true
  } = options;

  const handlePrint = useCallback(async () => {
    try {
      onBeforePrint?.();
      
      // Preload images if waitForImages is true
      if (waitForImages && printRef.current) {
        const images = printRef.current.querySelectorAll('img');
        const imagePromises = Array.from(images).map((img) => {
          return new Promise((resolve) => {
            if (img.complete) {
              resolve(img);
            } else {
              img.onload = () => resolve(img);
              img.onerror = () => {
                console.warn('Image failed to load for printing:', img.src);
                resolve(img); // Resolve anyway to continue printing
              };
            }
          });
        });
        
        await Promise.all(imagePromises);
      }
      
      // Use browser's built-in print functionality
      window.print();
      
      onAfterPrint?.();
      toast.success("Print completed successfully");
      
    } catch (error) {
      console.error('Print failed:', error);
      onPrintError?.(error);
      toast.error('Print failed. Please try again.');
    }
  }, [documentTitle, onBeforePrint, onAfterPrint, onPrintError, waitForImages]);

  return {
    printRef,
    handlePrint
  };
}; 
