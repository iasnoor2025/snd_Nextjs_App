import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface Option {
  value: string;
  label: string;
  [key: string]: any;
}

interface SearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchFields?: string[];
  loading?: boolean;
  error?: string;
}

export function SearchableSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found.",
  disabled = false,
  required = false,
  className,
  searchFields = ['label'],
  loading = false,
  error,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);

  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search value
  useEffect(() => {
    if (!searchValue.trim()) {
      setFilteredOptions(options);
      return;
    }

    const filtered = options.filter(option => {
      return searchFields.some(field => {
        const fieldValue = option[field];
        if (!fieldValue) return false;
        return String(fieldValue).toLowerCase().includes(searchValue.toLowerCase());
      });
    });
    setFilteredOptions(filtered);
  }, [searchValue, options, searchFields]);

  // Reset search when popover closes
  useEffect(() => {
    if (!open) {
      setSearchValue('');
    }
  }, [open]);

  return (
    <div className={cn("w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              error && "border-red-500 focus:border-red-500",
              disabled && "opacity-50 cursor-not-allowed"
            )}
            disabled={disabled}
          >
            <span className={cn(
              "truncate",
              !selectedOption && "text-muted-foreground"
            )}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder}
              value={searchValue}
              onValueChange={setSearchValue}
              className="border-0 focus:ring-0"
            />
            <CommandList>
              {loading && (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  Loading...
                </div>
              )}
              {!loading && filteredOptions.length === 0 && (
                <CommandEmpty>{emptyMessage}</CommandEmpty>
              )}
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={(currentValue) => {
                      onValueChange(currentValue);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
