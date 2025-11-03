'use client';

import { useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import { H2SCardData } from '@/lib/services/h2s-card-service';
import { H2SCardView } from './H2SCardView';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface H2SCardPrintProps {
  cardData: H2SCardData;
}

export function H2SCardPrint({ cardData }: H2SCardPrintProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `H2S-Card-${cardData.cardNumber}`,
    pageStyle: `
      @page {
        size: 85.6mm 53.98mm;
        margin: 0;
      }
      @media print {
        body {
          margin: 0;
          padding: 0;
        }
        .print-card {
          page-break-after: always;
          width: 85.6mm;
          height: 53.98mm;
          margin: 0 auto;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  });

  return (
    <div>
      <div className="no-print mb-4">
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Card
        </Button>
      </div>
      <div ref={printRef} className="print-container">
        <H2SCardView cardData={cardData} showBothSides />
      </div>
    </div>
  );
}

