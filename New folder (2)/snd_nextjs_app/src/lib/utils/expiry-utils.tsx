import { useI18n } from '@/hooks/use-i18n';
import React from 'react';

export interface ExpiryStatus {
  status: 'valid' | 'expiring' | 'expired' | 'none';
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  daysRemaining?: number;
}

export const getExpiryStatus = (expiryDate: string | null | undefined): ExpiryStatus => {
  if (!expiryDate) {
    return {
      status: 'none',
      color: 'text-gray-500',
      textColor: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    };
  }

  try {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const timeDiff = expiry.getTime() - today.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysRemaining < 0) {
      // Expired
      return {
        status: 'expired',
        color: 'text-red-600',
        textColor: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        daysRemaining: Math.abs(daysRemaining),
      };
    } else if (daysRemaining <= 30) {
      // Expiring soon (within 30 days)
      return {
        status: 'expiring',
        color: 'text-yellow-600',
        textColor: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        daysRemaining,
      };
    } else {
      // Valid (more than 30 days remaining)
      return {
        status: 'valid',
        color: 'text-green-600',
        textColor: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        daysRemaining,
      };
    }
  } catch (error) {
    return {
      status: 'none',
      color: 'text-gray-500',
      textColor: 'text-gray-500',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
    };
  }
};

export const getExpiryStatusText = (expiryDate: string | null | undefined): string => {
  const status = getExpiryStatus(expiryDate);
  
  if (status.status === 'none') return '';
  if (status.status === 'expired') return `Expired ${status.daysRemaining || 0} days ago`;
  if (status.status === 'expiring') return `Expires in ${status.daysRemaining || 0} days`;
  if (status.status === 'valid') return `Valid (${status.daysRemaining || 0} days remaining)`;
  
  return '';
};

export const formatDate = (dateString: string | null | undefined): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return 'N/A'; 
  }
};

// Hook for using expiry status with translations
export const useExpiryStatus = () => {
  const { t } = useI18n();

  const getExpiryStatusWithTranslation = (expiryDate: string | null | undefined): ExpiryStatus => {
    return getExpiryStatus(expiryDate);
  };

  const getExpiryStatusTextWithTranslation = (expiryDate: string | null | undefined): string => {
    const status = getExpiryStatus(expiryDate);
    
    if (status.status === 'none') return '';
    if (status.status === 'expired') return t('employee.expiry.expired', { days: String(status.daysRemaining || 0) });
    if (status.status === 'expiring') return t('employee.expiry.expiring', { days: String(status.daysRemaining || 0) });
    if (status.status === 'valid') return t('employee.expiry.valid', { days: String(status.daysRemaining || 0) });
    
    return '';
  };

  return {
    getExpiryStatus: getExpiryStatusWithTranslation,
    getExpiryStatusText: getExpiryStatusTextWithTranslation,
    formatDate,
  };
};

// Component for displaying expiry status with auto-indicator
export const ExpiryStatusDisplay: React.FC<{ 
  expiryDate: string | null | undefined;
  showAutoIndicator?: boolean;
  className?: string;
}> = ({ 
  expiryDate, 
  showAutoIndicator = true,
  className = "" 
}) => {
  const { getExpiryStatusText } = useExpiryStatus();
  const status = getExpiryStatus(expiryDate);

  if (!expiryDate) {
    return (
      <div className={`p-2 rounded-md border bg-gray-50 border-gray-200 ${className}`}>
        <div className="text-gray-500">N/A</div>
      </div>
    );
  }

  return (
    <div className={`p-2 rounded-md border ${status.bgColor} ${status.borderColor} ${className}`}>
      <div className={`font-medium ${status.textColor}`}>
        {formatDate(expiryDate)} {getExpiryStatusText(expiryDate)}
        {showAutoIndicator && status.status === 'expired' && (
          <span className="ml-1 text-xs">⚠️</span>
        )}
      </div>
    </div>
  );
};
