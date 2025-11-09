'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatArabicDate, formatDateForInput } from '@/lib/utils/date-utils';
import { CalendarIcon } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { HijriCalendar } from './HijriCalendar';

interface HijriDatePickerProps {
  value: string; // Gregorian date in YYYY-MM-DD format
  onChange: (value: string) => void; // Returns Gregorian date in YYYY-MM-DD format
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr';
}

export function HijriDatePicker({
  value,
  onChange,
  placeholder = 'اختر تاريخ',
  disabled = false,
  className = '',
  dir = 'rtl',
}: HijriDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [hijriDisplay, setHijriDisplay] = useState<string>('');

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        const hijri = formatArabicDate(value);
        setHijriDisplay(hijri);
      } else {
        setSelectedDate(undefined);
        setHijriDisplay('');
      }
    } else {
      setSelectedDate(undefined);
      setHijriDisplay('');
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formatted = formatDateForInput(date);
      const hijri = formatArabicDate(date);
      setHijriDisplay(hijri);
      onChange(formatted);
    } else {
      setSelectedDate(undefined);
      setHijriDisplay('');
      onChange('');
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !selectedDate && 'text-muted-foreground',
            dir === 'rtl' && 'text-right',
            className
          )}
          disabled={disabled}
          dir={dir}
        >
          <CalendarIcon className={cn('h-4 w-4', dir === 'rtl' ? 'ml-2' : 'mr-2')} />
          {hijriDisplay || <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={dir === 'rtl' ? 'end' : 'start'} dir={dir}>
        <HijriCalendar
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
          dir={dir}
        />
      </PopoverContent>
    </Popover>
  );
}

