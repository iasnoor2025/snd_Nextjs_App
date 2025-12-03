'use client';

import { H2SCardData } from '@/lib/services/h2s-card-service';
import { H2SCardFront } from './H2SCardFront';
import { H2SCardBack } from './H2SCardBack';

interface H2SCardViewProps {
  cardData: H2SCardData;
  showBothSides?: boolean;
}

export function H2SCardView({ cardData, showBothSides = false }: H2SCardViewProps) {
  return (
    <div className="space-y-8 flex flex-col items-center">
      <H2SCardFront cardData={cardData} />
      {showBothSides && <H2SCardBack cardData={cardData} />}
    </div>
  );
}

