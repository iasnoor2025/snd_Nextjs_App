'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  formatDateForInput,
} from '@/lib/utils/date-utils';
import { useEffect, useState, useRef } from 'react';
import { HijriDatePicker } from './HijriDatePicker';

interface DualDateInputProps {
  label?: string;
  value: string; // Gregorian date in YYYY-MM-DD format (stored value)
  onChange: (value: string) => void; // Returns Gregorian date in YYYY-MM-DD format
  arabicLabel?: string;
  englishLabel?: string;
  className?: string;
  required?: boolean;
}

export default function DualDateInput({
  label,
  value,
  onChange,
  arabicLabel = 'تاريخ انتهاء التأمين (هجري)',
  englishLabel = 'Insurance Expiry Date (Gregorian)',
  className = '',
  required = false,
}: DualDateInputProps) {
  const [gregorianDate, setGregorianDate] = useState('');
  const gregorianInputRef = useRef<HTMLInputElement>(null);

  // Initialize dates from value prop
  useEffect(() => {
    if (value) {
      const formatted = formatDateForInput(value);
      setGregorianDate(formatted);
    } else {
      setGregorianDate('');
    }
  }, [value]);

  // Handle Gregorian date input change
  const handleGregorianChange = (inputValue: string) => {
    setGregorianDate(inputValue);
    onChange(inputValue);
  };

  // Handle Hijri date picker change (it already converts to Gregorian)
  const handleHijriChange = (gregorianValue: string) => {
    setGregorianDate(gregorianValue);
    onChange(gregorianValue);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label className="text-sm font-medium">{label}</Label>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* English (Gregorian) Date Input */}
        <div className="space-y-2">
          <Label htmlFor="gregorian-date" className="text-sm font-medium text-muted-foreground">
            {englishLabel}
          </Label>
          <Input
            ref={gregorianInputRef}
            id="gregorian-date"
            type="date"
            value={gregorianDate}
            onChange={(e) => handleGregorianChange(e.target.value)}
            dir="ltr"
            required={required}
          />
        </div>

        {/* Arabic (Hijri) Date Picker */}
        <div className="space-y-2">
          <Label htmlFor="hijri-date" className="text-sm font-medium text-muted-foreground" dir="rtl">
            {arabicLabel}
          </Label>
          <HijriDatePicker
            value={gregorianDate || value}
            onChange={handleHijriChange}
            placeholder="اختر تاريخ"
            dir="rtl"
            className={required ? 'required' : ''}
          />
        </div>
      </div>
    </div>
  );
}

