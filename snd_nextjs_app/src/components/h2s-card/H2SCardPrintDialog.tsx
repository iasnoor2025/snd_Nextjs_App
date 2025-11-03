'use client';

import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { H2SCardData } from '@/lib/services/h2s-card-service';
import { H2SCardFront } from './H2SCardFront';
import { H2SCardBack } from './H2SCardBack';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface H2SCardPrintDialogProps {
  cardData: H2SCardData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function H2SCardPrintDialog({ cardData, open, onOpenChange }: H2SCardPrintDialogProps) {
  const frontPrintRef = useRef<HTMLDivElement>(null);
  const backPrintRef = useRef<HTMLDivElement>(null);
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');

  const handlePrintFront = useReactToPrint({
    content: () => frontPrintRef.current,
    documentTitle: `H2S-Card-${cardData?.cardNumber}-Front`,
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
        .no-print {
          display: none !important;
        }
        .scale-\\[2\\] {
          transform: scale(1) !important;
        }
        .print-card {
          width: 85.6mm;
          height: 53.98mm;
          margin: 0 auto;
        }
      }
    `,
  });

  const handlePrintBack = useReactToPrint({
    content: () => backPrintRef.current,
    documentTitle: `H2S-Card-${cardData?.cardNumber}-Back`,
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
        .no-print {
          display: none !important;
        }
        .scale-\\[2\\] {
          transform: scale(1) !important;
        }
        .print-card {
          width: 85.6mm;
          height: 53.98mm;
          margin: 0 auto;
        }
      }
    `,
  });

  if (!cardData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-4 overflow-visible">
        <DialogHeader className="mb-3 pb-3 border-b">
          <DialogTitle className="text-lg">H2S Certification Card - {cardData.cardNumber}</DialogTitle>
        </DialogHeader>
        
        {/* Tabs for Front/Back */}
        <div className="flex gap-2 mb-4 border-b pb-2">
          <button
            onClick={() => setActiveSide('front')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeSide === 'front'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderBottom: activeSide === 'front' ? '2px solid rgb(37, 99, 235)' : '2px solid transparent',
            }}
          >
            Front
          </button>
          <button
            onClick={() => setActiveSide('back')}
            className={`px-4 py-2 font-medium transition-colors relative ${
              activeSide === 'back'
                ? 'text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            style={{
              borderBottom: activeSide === 'back' ? '2px solid rgb(37, 99, 235)' : '2px solid transparent',
            }}
          >
            Back
          </button>
        </div>

        {/* Card Display - Fit without scrolling */}
        <div className="flex flex-col items-center gap-4 py-4">
          {activeSide === 'front' ? (
            <>
              <div 
                ref={frontPrintRef} 
                className="flex justify-center scale-[1.75] origin-top"
              >
                <H2SCardFront cardData={cardData} />
              </div>
              <div className="no-print mt-4">
                <Button onClick={handlePrintFront} className="w-auto">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Front
                </Button>
              </div>
            </>
          ) : (
            <>
              <div 
                ref={backPrintRef} 
                className="flex justify-center scale-[1.75] origin-top"
              >
                <H2SCardBack cardData={cardData} />
              </div>
              <div className="no-print mt-4">
                <Button onClick={handlePrintBack} className="w-auto">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Back
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

