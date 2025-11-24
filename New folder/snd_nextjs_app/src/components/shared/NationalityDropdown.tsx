import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useCountries } from '@/hooks/use-countries';

interface NationalityDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function NationalityDropdown({
  value,
  onValueChange,
  placeholder = "Select nationality...",
  className,
  disabled = false
}: NationalityDropdownProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('');
  const { countries, loading, error, searchCountries } = useCountries();
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchCountries(searchValue);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchValue, searchCountries]);

  // Find the selected country by matching nationality or name
  const selectedCountry = countries.find(country => 
    country.nationality === value || country.name === value
  );

  // Update selected country code when value changes
  useEffect(() => {
    if (selectedCountry) {
      setSelectedCountryCode(selectedCountry.code);
    } else {
      setSelectedCountryCode('');
    }
  }, [selectedCountry]);

  const handleSelect = (currentValue: string) => {
    // currentValue is now the country code
    const country = countries.find(c => c.code === currentValue);
    if (country) {
      onValueChange(country.nationality);
      setSelectedCountryCode(country.code);
      setOpen(false);
      setSearchValue('');
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          {selectedCountry ? (
            <div className="flex items-center gap-2">
              <img 
                src={selectedCountry.flag} 
                alt={selectedCountry.name}
                className="w-4 h-3 object-cover rounded-sm"
              />
              <span>{selectedCountry.nationality}</span>
            </div>
          ) : (
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search countries..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading countries...' : 'No countries found.'}
            </CommandEmpty>
            {error && (
              <div className="p-3 text-sm text-destructive">
                Error: {error}
              </div>
            )}
            <CommandGroup>
              {countries.map((country) => (
                <CommandItem
                  key={country.code}
                  value={country.code} // Use country code as the unique value
                  onSelect={handleSelect}
                  className="flex items-center gap-2"
                >
                  <img 
                    src={country.flag} 
                    alt={country.name}
                    className="w-4 h-3 object-cover rounded-sm"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{country.nationality}</span>
                    <span className="text-xs text-muted-foreground">
                      {country.name}
                    </span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedCountryCode === country.code ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
