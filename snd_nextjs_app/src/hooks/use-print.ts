import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
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

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
    onBeforePrint: async () => {
      onBeforePrint?.();
      
      // Preload images if waitForImages is true
      if (waitForImages && printRef.current) {
        const images = printRef.current.querySelectorAll('img');
        const imagePromises = Array.from(images).map((img) => {
          return new Promise((resolve, reject) => {
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
    },
    onAfterPrint: () => {
      onAfterPrint?.();
      toast.success("Print completed successfully");
    },
    onPrintError: (error) => {
      onPrintError?.(error);
      console.error("Print error:", error);
      toast.error("Print failed. Please try again.");
    },
  });

  return {
    printRef,
    handlePrint
  };
}; 