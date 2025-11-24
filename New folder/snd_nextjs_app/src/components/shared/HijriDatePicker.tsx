'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { formatArabicDate, formatDateForInput, gregorianToHijri, hijriToGregorian } from '@/lib/utils/date-utils';
import { CalendarIcon } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { HijriCalendar } from './HijriCalendar';

interface HijriDatePickerProps {
  value: string; // Gregorian date in YYYY-MM-DD format
  onChange: (value: string) => void; // Returns Gregorian date in YYYY-MM-DD format
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  dir?: 'rtl' | 'ltr';
  required?: boolean;
}

export function HijriDatePicker({
  value,
  onChange,
  placeholder = 'YYYY/MM/DD',
  disabled = false,
  className = '',
  dir = 'rtl',
  required = false,
}: HijriDatePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [hijriDisplay, setHijriDisplay] = useState<string>('');
  const [hijriInput, setHijriInput] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize from value prop
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        const hijri = formatArabicDate(value);
        const hijriNumeric = gregorianToHijri(value);
        setHijriDisplay(hijri);
        setHijriInput(hijriNumeric);
      } else {
        setSelectedDate(undefined);
        setHijriDisplay('');
        setHijriInput('');
      }
    } else {
      setSelectedDate(undefined);
      setHijriDisplay('');
      setHijriInput('');
    }
  }, [value]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formatted = formatDateForInput(date);
      const hijri = formatArabicDate(date);
      const hijriNumeric = gregorianToHijri(formatted);
      setHijriDisplay(hijri);
      setHijriInput(hijriNumeric);
      onChange(formatted);
    } else {
      setSelectedDate(undefined);
      setHijriDisplay('');
      setHijriInput('');
      onChange('');
    }
  };

  const handleHijriInputChange = (inputValue: string) => {
    if (isUpdating) return;
    
    setHijriInput(inputValue);
    
    // Convert to Gregorian when user finishes typing (format: YYYY/MM/DD)
    if (inputValue.length >= 8) {
      const normalized = inputValue.replace(/\//g, '-');
      const parts = normalized.split('-');
      
      if (parts.length === 3) {
        const year = parts[0];
        const month = parts[1];
        const day = parts[2];
        
        // Validate format
        if (year.length === 4 && month.length === 2 && day.length === 2) {
          setIsUpdating(true);
          const gregorian = hijriToGregorian(inputValue);
          
          if (gregorian) {
            const date = new Date(gregorian);
            if (!isNaN(date.getTime())) {
              setSelectedDate(date);
              const hijri = formatArabicDate(date);
              setHijriDisplay(hijri);
              onChange(gregorian);
            }
          }
          
          setTimeout(() => setIsUpdating(false), 100);
        }
      }
    } else if (inputValue === '') {
      setIsUpdating(true);
      setSelectedDate(undefined);
      setHijriDisplay('');
      onChange('');
      setTimeout(() => setIsUpdating(false), 100);
    }
  };

  const handleHijriInputBlur = () => {
    if (hijriInput && hijriInput.length > 0) {
      // Normalize format to YYYY/MM/DD
      const normalized = hijriInput.replace(/\//g, '-');
      const parts = normalized.split('-');
      
      if (parts.length === 3) {
        const year = parts[0].padStart(4, '0');
        const month = parts[1].padStart(2, '0');
        const day = parts[2].padStart(2, '0');
        const formatted = `${year}/${month}/${day}`;
        setHijriInput(formatted);
        
        // Try to convert if not already converted
        const gregorian = hijriToGregorian(formatted);
        if (gregorian) {
          const date = new Date(gregorian);
          if (!isNaN(date.getTime())) {
            setSelectedDate(date);
            const hijri = formatArabicDate(date);
            setHijriDisplay(hijri);
            onChange(gregorian);
          }
        }
      }
    }
  };

  return (
    <div className="relative flex w-full">
      <Input
        ref={inputRef}
        type="text"
        value={hijriInput}
        onChange={(e) => handleHijriInputChange(e.target.value)}
        onBlur={handleHijriInputBlur}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        dir={dir}
        className={cn(
          'text-right pr-10',
          dir === 'rtl' && 'text-right',
          className
        )}
      />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              'absolute h-full px-3',
              dir === 'rtl' ? 'left-0' : 'right-0',
              disabled && 'cursor-not-allowed opacity-50'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="h-4 w-4" />
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
    </div>
  );
}

