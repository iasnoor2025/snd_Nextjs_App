'use client';

import { 
  getDaysUntilExpiry, 
  isDateExpired, 
  isDateExpiringSoon,
  formatArabicDate,
  formatEnglishDate
} from '@/lib/utils/date-utils';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ExpiryDateDisplayProps {
  date: string | Date | null | undefined;
  showIcon?: boolean;
  showPrefix?: boolean;
  showArabicDate?: boolean;
  showEnglishDate?: boolean;
  className?: string;
}

export default function ExpiryDateDisplay({
  date,
  showIcon = true,
  showPrefix = true,
  showArabicDate = true,
  showEnglishDate = true,
  className = '',
}: ExpiryDateDisplayProps) {
  if (!date) {
    return <span className="text-muted-foreground">Not specified</span>;
  }

  const isExpired = isDateExpired(date);
  const isExpiringSoon = isDateExpiringSoon(date);
  const daysLeft = getDaysUntilExpiry(date);
  const arabicDate = formatArabicDate(date);
  const englishDate = formatEnglishDate(date);

  let statusColor = '';
  let statusText = '';
  let Icon = CheckCircle;

  if (isExpired) {
    statusColor = 'text-red-600';
    statusText = 'EXPIRED';
    Icon = AlertTriangle;
  } else if (isExpiringSoon) {
    statusColor = 'text-orange-600';
    statusText = `Expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;
    Icon = Clock;
  } else {
    statusColor = 'text-green-600';
    statusText = 'Valid';
    Icon = CheckCircle;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <Icon className={`h-4 w-4 ${statusColor}`} />}
      <div className="flex flex-col gap-1">
        {showPrefix && <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>}
        <div className="flex flex-col gap-1">
          {showArabicDate && (
            <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : ''}`} dir="rtl">
              {arabicDate}
            </span>
          )}
          {showEnglishDate && (
            <span className={`text-sm text-muted-foreground ${isExpired ? 'text-red-600 font-medium' : ''}`} dir="ltr">
              {englishDate}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
