'use client';

import { H2SCardData } from '@/lib/services/h2s-card-service';

interface H2SCardBackProps {
  cardData: H2SCardData;
}

export function H2SCardBack({ cardData }: H2SCardBackProps) {
  return (
    <div 
      className="h2s-card-back print-card bg-gray-100 border border-gray-300 relative mx-auto overflow-hidden"
      style={{ 
        width: '85.6mm',
        height: '53.98mm',
        fontSize: '6.3pt',
        lineHeight: 1.12,
        padding: '1.6mm',
        minWidth: '85.6mm',
        maxWidth: '85.6mm',
        minHeight: '53.98mm',
        maxHeight: '53.98mm',
        background:
          "radial-gradient(circle, rgba(200,200,200,0.08) 1px, transparent 1px) 0 0/20px 20px",
      }}
    >
      {/* Header with H2S Logo and certification line */}
      <div className="mb-[1.6mm]">
        <div className="flex items-center gap-[1.2mm]">
          <div className="flex items-center">
            <span className="text-orange-600 font-bold text-base">H</span>
            <span className="text-orange-600 font-bold text-[9px] align-sub">2</span>
            <span className="text-yellow-500 font-bold text-base">S</span>
          </div>
          <div className="text-yellow-500 text-[11px]">☠</div>
          <p className="ml-[2mm] text-[6.3pt] leading-tight">
            This Card certifies that the person has satisfactorily attended the H2S Training Program mentioned on the front of this card.
          </p>
        </div>
        <div className="mt-[1mm] w-full h-[0.3mm] bg-gray-400" />
      </div>

      {/* Exposure Levels - match visual layout */}
      <div className="grid grid-cols-3 gap-[1.6mm] mb-[1.6mm] items-start">
        {/* LOW */}
        <div>
          <div className="text-center text-blue-600 font-semibold mb-[0.6mm]">LOW</div>
          <div className="text-[5.8pt] text-black mb-[0.8mm]">0-10 PPM</div>
          <div className="bg-green-600 text-white p-[1mm] rounded">
            <ul className="text-[5.8pt] space-y-[0.4mm] list-disc list-inside">
              <li>Irritation of the eyes, nose, throat or respiration system</li>
            </ul>
          </div>
        </div>

        {/* MODERATE */}
        <div>
          <div className="text-center text-blue-600 font-semibold relative">
            MODERATE
            <div className="mx-auto mt-[0.6mm] h-[0.3mm] bg-gray-600 w-[18mm]" />
          </div>
          <div className="text-[5.8pt] text-black my-[0.8mm]">10-50 PPM</div>
          <div className="bg-yellow-500 text-white p-[1mm] rounded">
            <ul className="text-[5.8pt] space-y-[0.4mm] list-disc list-inside">
              <li>Headache</li>
              <li>Dizziness</li>
              <li>Nausea and Vomiting</li>
              <li>Coughing and breathing difficulty</li>
            </ul>
          </div>
        </div>

        {/* HIGH */}
        <div>
          <div className="text-center text-blue-600 font-semibold relative">
            HIGH
            <div className="mx-auto mt-[0.6mm] h-[0.3mm] bg-gray-600 w-[18mm]" />
          </div>
          <div className="text-[5.8pt] text-black my-[0.8mm]">50-200 PPM</div>
          <div className="bg-red-600 text-white p-[1mm] rounded">
            <ul className="text-[5.8pt] space-y-[0.4mm] list-disc list-inside">
              <li>Eye Irritation/acute conjunctivitis</li>
              <li>Severe respiratory tract irritation</li>
              <li>Convulsions</li>
              <li>Shock</li>
              <li>Coma</li>
              <li>Death in severe cases</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Safety Contact */}
      <div className="text-center leading-tight mt-[0.6mm]">
        <div className="w-full h-[0.6mm] bg-gray-400 mb-[0.8mm]" />
        <span className="font-bold text-red-800 text-[6.8pt] underline">For Safety Assistance Contact: - </span>
        <span className="text-[6.8pt] text-red-800">0572007285,0556894112</span>
      </div>
    </div>
  );
}

