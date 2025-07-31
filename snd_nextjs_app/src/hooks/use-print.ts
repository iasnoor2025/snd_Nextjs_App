import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { toast } from "sonner";

interface UsePrintOptions {
  documentTitle?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
  onPrintError?: (error: any) => void;
}

export const usePrint = (options: UsePrintOptions = {}) => {
  const printRef = useRef<HTMLDivElement>(null);

  const {
    documentTitle = "Document",
    onBeforePrint,
    onAfterPrint,
    onPrintError
  } = options;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle,
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