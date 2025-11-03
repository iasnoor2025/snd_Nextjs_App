'use client';

import { H2SCardData } from '@/lib/services/h2s-card-service';
import Image from 'next/image';
import { useMemo, useState } from 'react';

interface H2SCardFrontProps {
  cardData: H2SCardData;
}

export function H2SCardFront({ cardData }: H2SCardFrontProps) {
  const [logoError, setLogoError] = useState(false);
  
  // Get logo path - use relative path for Next.js Image component
  const getLogoPath = () => {
    const logo = cardData.companyLogo || '/snd-logo.png';
    
    // If already absolute URL (from external source), return as is
    if (logo.startsWith('http')) return logo;
    
    // Ensure path starts with / for Next.js Image
    return logo.startsWith('/') ? logo : `/${logo}`;
  };
  
  const logoPath = getLogoPath();
  const absoluteLogo = useMemo(() => {
    const src = logoPath || '';
    if (!src) return '';
    if (src.startsWith('http')) return src;
    if (typeof window !== 'undefined') return `${window.location.origin}${src.startsWith('/') ? src : `/${src}`}`;
    return src.startsWith('/') ? src : `/${src}`;
  }, [logoPath]);
  const absoluteEmployeePhoto = useMemo(() => {
    const src = cardData.employeePhoto || '';
    if (!src) return '';
    if (src.startsWith('http')) return src;
    if (typeof window !== 'undefined') return `${window.location.origin}${src.startsWith('/') ? src : `/${src}`}`;
    return src.startsWith('/') ? src : `/${src}`;
  }, [cardData.employeePhoto]);
  const absoluteQr = useMemo(() => {
    const src = cardData.qrCodeUrl || '';
    if (!src) return '';
    if (src.startsWith('http')) return src;
    if (typeof window !== 'undefined') return `${window.location.origin}${src.startsWith('/') ? src : `/${src}`}`;
    return src.startsWith('/') ? src : `/${src}`;
  }, [cardData.qrCodeUrl]);

  return (
    <div 
      className="h2s-card-front print-card bg-white border border-gray-300 relative mx-auto overflow-hidden"
      style={{ 
        width: '85.6mm',
        height: '53.98mm',
        fontSize: '6.3pt',
        lineHeight: 1.12,
        padding: '1.6mm',
        minWidth: '85.6mm',
        maxWidth: '85.6mm',
        minHeight: '53.98mm',
        maxHeight: '53.98mm'
      }}
    >
      {/* Header */}
      <div className="grid mb-1"
        style={{ gridTemplateColumns: '12mm 1fr auto', alignItems: 'center', columnGap: '2mm' }}
      >
        {/* Logo */}
        <div className="relative flex-shrink-0 bg-white border border-gray-200 flex items-center justify-center overflow-hidden"
          style={{ width: '12mm', height: '10mm' }}
        >
          {!logoError && absoluteLogo ? (
              <img
                src={absoluteLogo}
                alt="Logo"
                className="w-full h-full object-contain p-0.5"
                crossOrigin="anonymous"
                onError={() => {
                  setLogoError(true);
                }}
                onLoad={() => setLogoError(false)}
              />
            ) : (
              <span className="text-[6pt] text-gray-400">Logo</span>
            )}
        </div>
        {/* Company Name */}
        <div className="font-bold italic text-teal-700 truncate" style={{ fontSize: '7pt' }}>
          {cardData.companyName}
        </div>
        {/* Card Number */}
        <div className="text-right leading-none">
          <div>Card</div>
          <div>
            <span>No.: </span>
            <span className="font-bold text-red-600">{cardData.cardNumber}</span>
          </div>
        </div>
      </div>

      {/* Employee Info */}
      <div className="flex justify-between mb-[0.8mm] text-[7pt] leading-tight break-words">
        <div>
          <span className="font-bold">Name: - </span>
          <span>{cardData.employeeName}</span>
        </div>
        <div>
          <span className="font-bold">Iqama No.</span>
          <span>{cardData.iqamaNumber || 'N/A'}</span>
        </div>
      </div>

      {/* Yellow Banner */}
      <div className="bg-yellow-400 py-[0.3mm] px-[1.6mm] mb-[0.8mm] rounded-sm">
        <p className="italic text-center break-words" style={{ fontSize: '5.8pt' }}>
          This card acknowledges that the recipient has successfully completed the course.
        </p>
      </div>

      {/* Photo and Course Details */}
      <div className="flex gap-[1.6mm]">
        {/* Photo */}
        <div className="border border-gray-300 bg-gray-100 flex items-center justify-center overflow-hidden"
          style={{ width: '16mm', height: '20mm' }}
        >
          {absoluteEmployeePhoto ? (
            <img src={absoluteEmployeePhoto} alt={cardData.employeeName} className="object-cover w-full h-full" crossOrigin="anonymous" />
          ) : (
            <div className="text-xs text-gray-400">Photo</div>
          )}
        </div>

        {/* Course Details + QR */}
        <div className="flex-1 flex gap-[1.6mm]">
          {/* Left Details */}
          <div className="flex-1 space-y-[0.5mm] text-[6.3pt] leading-tight break-words hyphens-auto">
            <div className="grid" style={{ gridTemplateColumns: 'auto 1.5mm 1fr', columnGap: '1mm' }}>
              <span className="font-bold whitespace-nowrap">Course:</span>
              <span className="text-center">-</span>
              <span className="underline">{cardData.courseName}</span>
            </div>
            <div className="grid mt-[0.8mm]" style={{ gridTemplateColumns: 'auto 1.5mm 1fr', columnGap: '1mm' }}>
              <span className="font-bold whitespace-nowrap">Completion Date:</span>
              <span className="text-center">-</span>
              <span className="underline">{cardData.completionDate}</span>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'auto 1.5mm 1fr', columnGap: '1mm' }}>
              <span className="font-bold whitespace-nowrap">Expires:</span>
              <span className="text-center">-</span>
              <span className="underline">{cardData.expiryDate}</span>
            </div>
          </div>
          {/* QR Code */}
          {absoluteQr && (
            <div className="border border-gray-300 flex items-center justify-center"
              style={{ width: '16mm', height: '16mm' }}
            >
              <img src={absoluteQr} alt="QR Code" className="w-full h-full object-contain" crossOrigin="anonymous" />
            </div>
          )}
        </div>
      </div>

      {/* Trainer Info */}
      <div className="mt-1 flex items-end justify-between" style={{ fontSize: '6pt' }}>
        <div>
          <span className="font-bold">Trainer: </span>
          <span>{cardData.trainerName}</span>
          <span> (Train the Trainer) certified from</span>
          <div className="flex items-center gap-[1mm] mt-[0.3mm]">
            <span className="font-bold text-[8px]">IADC</span>
            {/* Use IADC logo from public/iadc-logo.png (place provided image there) */}
            <img
              src={typeof window !== 'undefined' ? `${window.location.origin}/iadc-logo.png` : '/iadc-logo.png'}
              alt="IADC Logo"
              width={14}
              height={14}
              className="inline-block object-contain"
              crossOrigin="anonymous"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
                const fallback = target.nextElementSibling as HTMLElement | null;
                if (fallback) fallback.style.display = 'inline-block';
              }}
            />
            {/* Fallback inline badge if logo file not present */}
            <svg width="12" height="12" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ display: 'none' }}>
              <circle cx="12" cy="12" r="12" fill="#dc2626" />
              <text x="12" y="15" textAnchor="middle" fontSize="9" fontWeight="700" fill="#ffffff">IADC</text>
            </svg>
            <span className="font-bold text-[8px]">IADC</span>
          </div>
        </div>
        <div>
          <span className="font-bold">Signature: -</span>
          <span className="font-handwriting italic text-[9px]">
            {cardData.trainerName.charAt(0)}{cardData.trainerName.split(' ').pop()}
          </span>
        </div>
      </div>
    </div>
  );
}

