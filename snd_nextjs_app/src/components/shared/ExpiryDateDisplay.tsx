'use client';

import { getDaysUntilExpiry, isDateExpired, isDateExpiringSoon } from '@/lib/utils/date-utils';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ExpiryDateDisplayProps {
  date: string | Date | null | undefined;
  showIcon?: boolean;
  showPrefix?: boolean;
  className?: string;
}

export default function ExpiryDateDisplay({
  date,
  showIcon = true,
  showPrefix = true,
  className = '',
}: ExpiryDateDisplayProps) {
  if (!date) {
    return <span className="text-muted-foreground">Not specified</span>;
  }

  const isExpired = isDateExpired(date);
  const isExpiringSoon = isDateExpiringSoon(date);
  const daysLeft = getDaysUntilExpiry(date);
  const formattedDate = new Date(date).toLocaleDateString();

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
      <div className="flex flex-col">
        {showPrefix && <span className={`text-xs font-medium ${statusColor}`}>{statusText}</span>}
        <span className={`text-sm ${isExpired ? 'text-red-600 font-medium' : ''}`}>
          {formattedDate}
        </span>
      </div>
    </div>
  );
}
