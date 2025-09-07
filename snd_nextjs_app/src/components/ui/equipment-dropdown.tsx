'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useEffect, useState } from 'react';

export interface Equipment {
  id: string;
  name: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  chassisNumber?: string;
  doorNumber?: string;
  status?: string;
  dailyRate?: number;
  daily_rate?: number;
  weeklyRate?: number;
  monthlyRate?: number;
  category?: string;
  description?: string;
}

interface EquipmentDropdownProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
  required?: boolean;
  showSearch?: boolean;
  className?: string;
  error?: string;
  loading?: boolean;
  onLoadingChange?: (loading: boolean) => void;
}

export function EquipmentDropdown({
  value,
  onValueChange,
  placeholder = 'Select equipment',
  disabled = false,
  label,
  required = false,
  showSearch = true,
  className = '',
  error,
  loading: externalLoading,
  onLoadingChange,
}: EquipmentDropdownProps) {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  const loadEquipment = async () => {
    const currentLoading = true;
    setLoading(currentLoading);
    onLoadingChange?.(currentLoading);
    setErrorMessage(null);

    try {
      // Fetch equipment with a high limit to get all equipment
      const response = await fetch('/api/equipment?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Handle different response formats
      const equipmentData = data.data || data.equipment || data || [];

      if (equipmentData.length === 0) {
        setErrorMessage('No equipment found in the database.');
      }

      setEquipment(equipmentData);
    } catch (error) {
      let errorMsg = 'Failed to load equipment. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('Network error')) {
          errorMsg =
            'Network error: Unable to connect to the server. Please check your connection.';
        } else if (error.message.includes('500')) {
          errorMsg = 'Server error: Database connection issue. Please contact support.';
        } else if (error.message.includes('404')) {
          errorMsg = 'API endpoint not found. Please check the server configuration.';
        } else {
          errorMsg = `Error: ${error.message}`;
        }
      }

      setErrorMessage(errorMsg);
      setEquipment([]);
    } finally {
      const currentLoading = false;
      setLoading(currentLoading);
      onLoadingChange?.(currentLoading);
    }
  };

  // Load equipment when component mounts
  useEffect(() => {
    loadEquipment();
  }, []);

  // Filter equipment based on search term
  const filteredEquipment = equipment.filter(
    item =>
      !searchTerm ||
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.chassisNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.doorNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toString().includes(searchTerm)
  );

  // Sort equipment to prioritize name matches first, then others
  const sortedEquipment = filteredEquipment.sort((a, b) => {
    // If there's a search term, prioritize matches
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      
      // Check for exact name match first (highest priority)
      const aNameExact = a.name?.toLowerCase() === searchLower;
      const bNameExact = b.name?.toLowerCase() === searchLower;
      
      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;
      
      // Then check for name starts with
      const aNameStartsWith = a.name?.toLowerCase().startsWith(searchLower);
      const bNameStartsWith = b.name?.toLowerCase().startsWith(searchLower);
      
      if (aNameStartsWith && !bNameStartsWith) return -1;
      if (!aNameStartsWith && bNameStartsWith) return 1;
      
      // Then check for name contains
      const aNameContains = a.name?.toLowerCase().includes(searchLower);
      const bNameContains = b.name?.toLowerCase().includes(searchLower);
      
      if (aNameContains && !bNameContains) return -1;
      if (!aNameContains && bNameContains) return 1;
      
      // Then check for model matches
      const aModelContains = a.model?.toLowerCase().includes(searchLower);
      const bModelContains = b.model?.toLowerCase().includes(searchLower);
      
      if (aModelContains && !bModelContains) return -1;
      if (!aModelContains && bModelContains) return 1;
    }
    
    // Default sorting: by name alphabetically
    return (a.name || '').localeCompare(b.name || '');
  });

  // Get selected equipment for display
  const selectedEquipment = equipment.find(item => item.id === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label
          htmlFor="equipment-select"
          className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}
        >
          {label}
        </Label>
      )}

      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled || isLoading}>
        <SelectTrigger
          className={`w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        >
          <SelectValue placeholder={isLoading ? 'Loading equipment...' : placeholder} />
        </SelectTrigger>

        <SelectContent className="max-h-96 overflow-y-auto">
          {/* Search Input */}
          {showSearch && (
            <div className="p-2 border-b sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="Search equipment..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}

          {isLoading ? (
            <SelectItem value="loading" disabled>
              Loading equipment...
            </SelectItem>
          ) : errorMessage ? (
            <SelectItem value="error" disabled className="text-red-500">
              {errorMessage}
            </SelectItem>
          ) : equipment.length > 0 ? (
            <>
              {sortedEquipment
                .slice(0, searchTerm ? undefined : 100) // Show first 100 if no search, all if searching
                .map(item => (
                  <SelectItem
                    key={item.id}
                    value={item.id}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {item.name}
                      </span>
                      {item.model && (
                        <span className="text-sm text-blue-600">
                          Model: {item.model}
                        </span>
                      )}
                      {item.manufacturer && (
                        <span className="text-xs text-gray-500">
                          {item.manufacturer}
                        </span>
                      )}
                      {item.doorNumber && (
                        <span className="text-xs text-green-600 font-mono">
                          Door: {item.doorNumber}
                        </span>
                      )}
                      {(item.dailyRate || item.daily_rate) && (
                        <span className="text-xs text-purple-600">
                          Daily Rate: SAR {item.dailyRate || item.daily_rate}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              {!searchTerm && equipment.length > 100 && (
                <SelectItem value="more-equipment" disabled className="text-center text-gray-500">
                  Showing first 100 of {equipment.length} equipment. Type to search for more.
                </SelectItem>
              )}
              {searchTerm && sortedEquipment.length === 0 && (
                <SelectItem value="no-results" disabled>
                  No equipment found
                </SelectItem>
              )}
            </>
          ) : (
            <SelectItem value="no-equipment" disabled>
              No equipment available
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {selectedEquipment && (
        <div className="text-xs text-gray-500">
          Selected: {selectedEquipment.name}
          {selectedEquipment.model && ` (${selectedEquipment.model})`}
          {selectedEquipment.doorNumber && ` - Door: ${selectedEquipment.doorNumber}`}
        </div>
      )}
    </div>
  );
}

// Hook for using equipment data
export function useEquipment() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEquipment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/equipment?limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const equipmentData = data.data || data.equipment || data || [];
      setEquipment(equipmentData);
    } catch (err) {
      let errorMsg = 'Failed to load equipment';
      if (err instanceof Error) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipment();
  }, []);

  return { equipment, loading, error, refetch: loadEquipment };
}
