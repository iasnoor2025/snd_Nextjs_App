'use client';

import { useParams, useRouter, usePathname } from 'next/navigation';
import { validateLocale } from '@/lib/locale-utils';
import { useEffect, useState } from 'react';

export function useTranslations() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  
  // Safely extract locale with fallback
  let locale = validateLocale(params?.locale as string);
  
  // If no locale in params, try to get from cookie or default to 'en'
  if (!locale || locale === 'en') {
    // Try to get locale from cookie
    if (typeof document !== 'undefined') {
      const cookieLocale = document.cookie
        .split('; ')
        .find(row => row.startsWith('NEXT_LOCALE='))
        ?.split('=')[1];
      
      if (cookieLocale && ['en', 'ar'].includes(cookieLocale)) {
        locale = cookieLocale;
      }
    }
  }
  

  const [dictionary, setDictionary] = useState<Record<string, Record<string, unknown>> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const languages = [
    {
      code: 'en',
      name: 'English',
      flag: '🇺🇸',
      dir: 'ltr' as const,
    },
    {
      code: 'ar',
      name: 'العربية',
      flag: '🇸🇦',
      dir: 'rtl' as const,
    },
  ];

  useEffect(() => {
    // Load dictionary
    const loadDictionary = async () => {
      if (!locale) {
        return;
      }
      
      setIsLoading(true);
      try {
        const { getDictionary } = await import('@/lib/get-dictionary');
        const dict = await getDictionary(locale as 'en' | 'ar');
        
        setDictionary(dict);
      } catch (error) {
        console.error('Failed to load dictionary:', error);
        // Fallback to English if loading fails
        try {
          const { getDictionary } = await import('@/lib/get-dictionary');
          const dict = await getDictionary('en');
          setDictionary(dict);
        } catch (fallbackError) {
          console.error('Failed to load fallback dictionary:', fallbackError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadDictionary();
  }, [locale]);

  const t = (key: string, params?: Record<string, string>) => {
    if (!dictionary || isLoading) {
      // Return fallback values for common keys
      const fallbackValues: Record<string, string> = {
        'common.actions.refreshSession': 'Refresh Session',
        'common.actions.settings': 'Settings',
        'common.actions.profile': 'Profile',
        'common.actions.logout': 'Log out',
        'common.app.name': 'SND App',
        'common.loading': 'Loading...',
        'equipment.istimara.allTypes': 'All Types',
        'equipment.istimara.allDrivers': 'All Drivers',
        'equipment.istimara.withDriver': 'With Driver',
        'equipment.istimara.unassigned': 'Unassigned',
        'equipment.istimara.clear': 'Clear',
        'employee.advances.currentBalance': 'Current Balance',
        'employee.advances.active': 'Active',
        'employee.advances.noBalance': 'No Balance',
        'employee.advances.monthlyDeduction': 'Monthly Deduction',
        'employee.advances.configurable': 'Configurable',
        'employee.advances.currentMonthlyDeduction': 'Current Monthly Deduction',
        'employee.advances.companyWillDecide': 'Company will decide monthly deduction',
        'employee.advances.setMonthlyDeduction': 'Set monthly deduction amount',
        'employee.advances.estimatedRepayment': 'Estimated Repayment',
        'employee.advances.projected': 'Projected',
        'employee.advances.months': 'months',
        'employee.advances.basedOnCurrentBalance': 'Based on current balance and monthly deduction',
        'employee.advances.setMonthlyDeductionToSeeEstimate': 'Set monthly deduction to see estimate',
        'employee.advances.repaymentHistory': 'Repayment History',
        'employee.advances.amount': 'Amount',
        'employee.advances.date': 'Date',
        'employee.advances.notes': 'Notes',
        'employee.advances.actions': 'Actions',
        'employee.advances.noRepaymentHistory': 'No repayment history found.',
        'employee.advances.loadingPaymentHistory': 'Loading payment history...',
        'employee.advances.deleteRepayment': 'Delete Repayment',
        'employee.advances.deleteRepaymentConfirm': 'Are you sure you want to delete this repayment? This action cannot be undone.',
      };
      
      return fallbackValues[key] || key;
    }

    // Handle namespace.key format (e.g., "common.save", "dashboard.title")
    if (key.includes('.')) {
      const [namespace, ...keyParts] = key.split('.');
      const fullKey = keyParts.join('.');
      
      const namespaceDict = dictionary[namespace as keyof typeof dictionary];
      if (!namespaceDict) {
        // Return fallback values for common keys
        const fallbackValues: Record<string, string> = {
          'common.actions.refreshSession': 'Refresh Session',
          'common.actions.settings': 'Settings',
          'common.actions.profile': 'Profile',
          'common.actions.logout': 'Log out',
          'common.app.name': 'SND App',
          'common.loading': 'Loading...',
          'equipment.istimara.allTypes': 'All Types',
          'equipment.istimara.allDrivers': 'All Drivers',
          'equipment.istimara.withDriver': 'With Driver',
          'equipment.istimara.unassigned': 'Unassigned',
          'equipment.istimara.clear': 'Clear',
          'employee.advances.currentBalance': 'Current Balance',
          'employee.advances.active': 'Active',
          'employee.advances.noBalance': 'No Balance',
          'employee.advances.monthlyDeduction': 'Monthly Deduction',
          'employee.advances.configurable': 'Configurable',
          'employee.advances.currentMonthlyDeduction': 'Current Monthly Deduction',
          'employee.advances.companyWillDecide': 'Company will decide monthly deduction',
          'employee.advances.setMonthlyDeduction': 'Set monthly deduction amount',
          'employee.advances.estimatedRepayment': 'Estimated Repayment',
          'employee.advances.projected': 'Projected',
          'employee.advances.months': 'months',
          'employee.advances.basedOnCurrentBalance': 'Based on current balance and monthly deduction',
          'employee.advances.setMonthlyDeductionToSeeEstimate': 'Set monthly deduction to see estimate',
          'employee.advances.repaymentHistory': 'Repayment History',
          'employee.advances.amount': 'Amount',
          'employee.advances.date': 'Date',
          'employee.advances.notes': 'Notes',
          'employee.advances.actions': 'Actions',
          'employee.advances.noRepaymentHistory': 'No repayment history found.',
          'employee.advances.loadingPaymentHistory': 'Loading payment history...',
          'employee.advances.deleteRepayment': 'Delete Repayment',
          'employee.advances.deleteRepaymentConfirm': 'Are you sure you want to delete this repayment? This action cannot be undone.',
        };
        
        return fallbackValues[key] || key;
      }
      
      // Navigate to nested key
      let currentValue: unknown = namespaceDict;
      
      for (const k of fullKey.split('.')) {
        currentValue = (currentValue as Record<string, unknown>)?.[k];
        if (currentValue === undefined) {
          // Return fallback values for common keys
          const fallbackValues: Record<string, string> = {
            'common.actions.refreshSession': 'Refresh Session',
            'common.actions.settings': 'Settings',
            'common.actions.profile': 'Profile',
            'common.actions.logout': 'Log out',
            'common.app.name': 'SND App',
            'common.loading': 'Loading...',
            'equipment.istimara.allTypes': 'All Types',
            'equipment.istimara.allDrivers': 'All Drivers',
            'equipment.istimara.withDriver': 'With Driver',
            'equipment.istimara.unassigned': 'Unassigned',
            'equipment.istimara.clear': 'Clear',
          };
          
          return fallbackValues[key] || key;
        }
      }
      const value = currentValue;

      // Ensure we return a string, not an object
      if (typeof value !== 'string') {
        // Return fallback values for common keys
        const fallbackValues: Record<string, string> = {
          'common.actions.refreshSession': 'Refresh Session',
          'common.actions.settings': 'Settings',
          'common.actions.profile': 'Profile',
          'common.actions.logout': 'Log out',
          'common.app.name': 'SND App',
          'common.loading': 'Loading...',
          'equipment.istimara.allTypes': 'All Types',
          'equipment.istimara.allDrivers': 'All Drivers',
          'equipment.istimara.withDriver': 'With Driver',
          'equipment.istimara.unassigned': 'Unassigned',
          'equipment.istimara.clear': 'Clear',
          'employee.advances.currentBalance': 'Current Balance',
          'employee.advances.active': 'Active',
          'employee.advances.noBalance': 'No Balance',
          'employee.advances.monthlyDeduction': 'Monthly Deduction',
          'employee.advances.configurable': 'Configurable',
          'employee.advances.currentMonthlyDeduction': 'Current Monthly Deduction',
          'employee.advances.companyWillDecide': 'Company will decide monthly deduction',
          'employee.advances.setMonthlyDeduction': 'Set monthly deduction amount',
          'employee.advances.estimatedRepayment': 'Estimated Repayment',
          'employee.advances.projected': 'Projected',
          'employee.advances.months': 'months',
          'employee.advances.basedOnCurrentBalance': 'Based on current balance and monthly deduction',
          'employee.advances.setMonthlyDeductionToSeeEstimate': 'Set monthly deduction to see estimate',
          'employee.advances.repaymentHistory': 'Repayment History',
          'employee.advances.amount': 'Amount',
          'employee.advances.date': 'Date',
          'employee.advances.notes': 'Notes',
          'employee.advances.actions': 'Actions',
          'employee.advances.noRepaymentHistory': 'No repayment history found.',
          'employee.advances.loadingPaymentHistory': 'Loading payment history...',
          'employee.advances.deleteRepayment': 'Delete Repayment',
          'employee.advances.deleteRepaymentConfirm': 'Are you sure you want to delete this repayment? This action cannot be undone.',
        };
        
        return fallbackValues[key] || key;
      }
      
      // Now we know value is a string
      let stringValue: string = value;

      // Replace parameters
      if (params) {
        Object.entries(params).forEach(([param, replacement]) => {
          stringValue = stringValue.replace(new RegExp(`{{${param}}}`, 'g'), replacement);
        });
      }

      return stringValue || key;
    }

    // Fallback to common namespace if no namespace specified
    const commonDict = dictionary.common;
    if (commonDict && commonDict[key]) {
      const value = commonDict[key];
      
      // Ensure we return a string, not an object
      if (typeof value !== 'string') {
        // Return fallback values for common keys
        const fallbackValues: Record<string, string> = {
          'common.actions.refreshSession': 'Refresh Session',
          'common.actions.settings': 'Settings',
          'common.actions.profile': 'Profile',
          'common.actions.logout': 'Log out',
          'common.app.name': 'SND App',
          'common.loading': 'Loading...',
          'equipment.istimara.allTypes': 'All Types',
          'equipment.istimara.allDrivers': 'All Drivers',
          'equipment.istimara.withDriver': 'With Driver',
          'equipment.istimara.unassigned': 'Unassigned',
          'equipment.istimara.clear': 'Clear',
        };
        
        return fallbackValues[key] || key;
      }
      
      // Now we know value is a string
      let stringValue: string = value;
      
      // Replace parameters
      if (params) {
        Object.entries(params).forEach(([param, replacement]) => {
          stringValue = stringValue.replace(new RegExp(`{{${param}}}`, 'g'), replacement);
        });
      }
      
      return stringValue;
    }

    // Return fallback values for common keys
    const fallbackValues: Record<string, string> = {
      'common.actions.refreshSession': 'Refresh Session',
      'common.actions.settings': 'Settings',
      'common.actions.profile': 'Profile',
      'common.actions.logout': 'Log out',
      'common.app.name': 'SND App',
      'common.loading': 'Loading...',
      'equipment.istimara.allTypes': 'All Types',
      'equipment.istimara.allDrivers': 'All Drivers',
      'equipment.istimara.allStatuses': 'All Statuses',
      'equipment.istimara.noExpiryDate': 'No expiry date',
      'equipment.istimara.status.available': 'Available',
      'equipment.istimara.status.expiring': 'Expiring Soon',
      'equipment.istimara.status.expired': 'Expired',
      'equipment.istimara.status.missing': 'Missing',
      'equipment.istimara.assigned': 'Assigned',
      'equipment.istimara.withDriver': 'With Driver',
      'equipment.istimara.unassigned': 'Unassigned',
      'equipment.istimara.clear': 'Clear',
      'equipment.pagination.show': 'Show',
      'employee.advances.currentBalance': 'Current Balance',
      'employee.advances.active': 'Active',
      'employee.advances.noBalance': 'No Balance',
      'employee.advances.monthlyDeduction': 'Monthly Deduction',
      'employee.advances.configurable': 'Configurable',
      'employee.advances.currentMonthlyDeduction': 'Current Monthly Deduction',
      'employee.advances.companyWillDecide': 'Company will decide monthly deduction',
      'employee.advances.setMonthlyDeduction': 'Set monthly deduction amount',
      'employee.advances.estimatedRepayment': 'Estimated Repayment',
      'employee.advances.projected': 'Projected',
      'employee.advances.months': 'months',
      'employee.advances.basedOnCurrentBalance': 'Based on current balance and monthly deduction',
      'employee.advances.setMonthlyDeductionToSeeEstimate': 'Set monthly deduction to see estimate',
      'employee.advances.repaymentHistory': 'Repayment History',
      'employee.advances.amount': 'Amount',
      'employee.advances.date': 'Date',
      'employee.advances.notes': 'Notes',
      'employee.advances.actions': 'Actions',
      'employee.advances.noRepaymentHistory': 'No repayment history found.',
      'employee.advances.loadingPaymentHistory': 'Loading payment history...',
      'employee.advances.deleteRepayment': 'Delete Repayment',
      'employee.advances.deleteRepaymentConfirm': 'Are you sure you want to delete this repayment? This action cannot be undone.',
      'employee.advances.noAdvanceRecordsFound': 'No advance records found',
      'employee.advances.loadingAdvances': 'Loading advances...',
    };
    
    return fallbackValues[key] || key;
  };

  const changeLanguage = async (newLocale: string) => {
    try {
      // Remove current locale from pathname
      const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
      
      // Navigate to new locale
      router.push(`/${newLocale}${pathWithoutLocale}`);
      
      // Save to cookie
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
      
      // Save to database (optional)
      try {
        await fetch('/api/user/language', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ language: newLocale }),
        });
      } catch (error) {
        console.warn('Failed to save language preference to database:', error);
      }
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return {
    t,
    locale,
    isRTL: locale === 'ar',
    direction: locale === 'ar' ? 'rtl' : 'ltr',
    languages,
    changeLanguage,
    isLoading,
  };
}
