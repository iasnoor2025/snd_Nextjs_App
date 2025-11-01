'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  designation?: string | { name: string };
  hourly_rate?: number;
  employee_number?: string;
  file_number?: string;
  email?: string;
  phone?: string;
  department?: string | { name: string };
  status?: string;
  is_external?: boolean;
  company_name?: string | null;
}

interface EmployeeDropdownProps {
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

export function EmployeeDropdown({
  value,
  onValueChange,
  placeholder = 'Select an employee',
  disabled = false,
  label,
  required = false,
  showSearch = true,
  className = '',
  error,
  loading: externalLoading,
  onLoadingChange,
}: EmployeeDropdownProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  const loadEmployees = useCallback(async () => {
    const currentLoading = true;
    setLoading(currentLoading);
    onLoadingChange?.(currentLoading);
    setErrorMessage(null);

    try {
      // Check if employees are already cached
      const cachedEmployees = sessionStorage.getItem('employeesCache');
      const cacheTimestamp = sessionStorage.getItem('employeesCacheTimestamp');
      const now = Date.now();
      
      // Use cache if it's less than 5 minutes old
      if (cachedEmployees && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 300000) {
        const employeeData = JSON.parse(cachedEmployees);
        setEmployees(employeeData);
        setLoading(false);
        onLoadingChange?.(false);
        return;
      }

      // Use the public API endpoint that doesn't require authentication
      const response = await fetch('/api/employees/public?all=true&limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      const employeeData = data.data || data || [];

      if (employeeData.length === 0) {
        setErrorMessage('No employees found in the database.');
      }

      // Cache the employees data
      sessionStorage.setItem('employeesCache', JSON.stringify(employeeData));
      sessionStorage.setItem('employeesCacheTimestamp', Date.now().toString());

      setEmployees(employeeData);
    } catch (error) {

      let errorMsg = 'Failed to load employees. Please try again.';
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
      setEmployees([]);
    } finally {
      const currentLoading = false;
      setLoading(currentLoading);
      onLoadingChange?.(currentLoading);
    }
  }, [onLoadingChange]);

  // Load employees when component mounts
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 150);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Filter employees based on search term
  const filteredEmployees = React.useMemo(() => {
    if (!debouncedSearchTerm.trim()) {
      return employees;
    }
    
    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    
    return employees.filter(employee => {
      // Check first name
      if (employee.first_name?.toLowerCase().includes(searchLower)) return true;
      
      // Check last name
      if (employee.last_name?.toLowerCase().includes(searchLower)) return true;
      
      // Check designation
      const designationName = typeof employee.designation === 'string' 
        ? employee.designation 
        : employee.designation?.name;
      if (designationName?.toLowerCase().includes(searchLower)) return true;
      
      // Check employee number
      if (employee.employee_number?.toLowerCase().includes(searchLower)) return true;
      
      // Check file number
      if (employee.file_number?.toLowerCase().includes(searchLower)) return true;
      
      // Check email
      if (employee.email?.toLowerCase().includes(searchLower)) return true;
      
      // Check department
      const departmentName = typeof employee.department === 'string'
        ? employee.department
        : employee.department?.name;
      if (departmentName?.toLowerCase().includes(searchLower)) return true;
      
      // Check ID
      if (employee.id.toString().includes(searchLower)) return true;
      
      return false;
    });
  }, [employees, debouncedSearchTerm]);

  // Sort employees to prioritize file number matches first, then others
  const sortedEmployees = filteredEmployees.sort((a, b) => {
    // If there's a search term, prioritize matches
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      
             // Check for exact file number match first (highest priority)
       const aFileExact = a.file_number?.toLowerCase() === searchLower;
       const bFileExact = b.file_number?.toLowerCase() === searchLower;
       
       if (aFileExact && !bFileExact) return -1;
       if (!aFileExact && bFileExact) return 1;
       
       // If both have exact file number matches, sort numerically
       if (aFileExact && bFileExact) {
         const aNumeric = parseInt(a.file_number?.replace(/\D/g, '') || '') || 0;
         const bNumeric = parseInt(b.file_number?.replace(/\D/g, '') || '') || 0;
         if (aNumeric !== 0 && bNumeric !== 0) {
           return aNumeric - bNumeric;
         }
       }
      
             // Then check for file number starts with
       const aFileStartsWith = a.file_number?.toLowerCase().startsWith(searchLower);
       const bFileStartsWith = b.file_number?.toLowerCase().startsWith(searchLower);
       
       if (aFileStartsWith && !bFileStartsWith) return -1;
       if (!aFileStartsWith && bFileStartsWith) return 1;
       
       // If both have file number starts with matches, sort numerically
       if (aFileStartsWith && bFileStartsWith) {
         const aNumeric = parseInt(a.file_number?.replace(/\D/g, '') || '') || 0;
         const bNumeric = parseInt(b.file_number?.replace(/\D/g, '') || '') || 0;
         if (aNumeric !== 0 && bNumeric !== 0) {
           return aNumeric - bNumeric;
         }
       }
      
      // Then check for file number contains
      const aFileContains = a.file_number?.toLowerCase().includes(searchLower);
      const bFileContains = b.file_number?.toLowerCase().includes(searchLower);
      
      if (aFileContains && !bFileContains) return -1;
      if (!aFileContains && bFileContains) return 1;
      
      // Then check for exact name matches
      const aNameExact = `${a.first_name} ${a.last_name}`.toLowerCase() === searchLower;
      const bNameExact = `${b.first_name} ${b.last_name}`.toLowerCase() === searchLower;
      
      if (aNameExact && !bNameExact) return -1;
      if (!aNameExact && bNameExact) return 1;
      
      // Then check for name starts with
      const aNameStartsWith = `${a.first_name} ${a.last_name}`.toLowerCase().startsWith(searchLower);
      const bNameStartsWith = `${b.first_name} ${b.last_name}`.toLowerCase().startsWith(searchLower);
      
      if (aNameStartsWith && !bNameStartsWith) return -1;
      if (!aNameStartsWith && bNameStartsWith) return 1;
      
      // Then check for name contains
      const aNameContains = `${a.first_name} ${a.last_name}`.toLowerCase().includes(searchLower);
      const bNameContains = `${b.first_name} ${b.last_name}`.toLowerCase().includes(searchLower);
      
      if (aNameContains && !bNameContains) return -1;
      if (!aNameContains && bNameContains) return 1;
    }
    
    // Default sorting: employees with file numbers first, then by name
    const aHasFileNumber = !!a.file_number;
    const bHasFileNumber = !!b.file_number;
    
    if (aHasFileNumber && !bHasFileNumber) return -1;
    if (!aHasFileNumber && bHasFileNumber) return 1;
    
         // If both have file numbers, sort by file number using natural numeric sorting
     if (aHasFileNumber && bHasFileNumber) {
       const aFileNum = a.file_number || '';
       const bFileNum = b.file_number || '';
       
       // Extract numeric parts for natural sorting
       const aNumeric = parseInt(aFileNum.replace(/\D/g, '')) || 0;
       const bNumeric = parseInt(bFileNum.replace(/\D/g, '')) || 0;
       
       // If both have numeric parts, sort numerically
       if (aNumeric !== 0 && bNumeric !== 0) {
         return aNumeric - bNumeric;
       }
       
       // Fallback to string comparison for non-numeric file numbers
       return aFileNum.localeCompare(bFileNum);
     }
    
    // Finally, sort by name alphabetically
    return `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`);
  });

  // Get selected employee for display
  const selectedEmployee = employees.find(emp => emp.id === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label
          htmlFor="employee-select"
          className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ''}
        >
          {label}
        </Label>
      )}

      <Select value={value || undefined} onValueChange={onValueChange} disabled={disabled || isLoading}>
        <SelectTrigger
          className={`w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        >
          <SelectValue placeholder={isLoading ? 'Loading employees...' : placeholder} />
        </SelectTrigger>

        <SelectContent className="max-h-96 overflow-y-auto">
          {/* Search Input */}
          {showSearch && (
            <div className="p-2 border-b sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => {
                  e.stopPropagation();
                  setSearchTerm(e.target.value);
                }}
                onKeyDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                autoComplete="off"
              />
            </div>
          )}

          {isLoading ? (
            <SelectItem value="loading" disabled>
              Loading employees...
            </SelectItem>
          ) : errorMessage ? (
            <SelectItem value="error" disabled className="text-red-500">
              {errorMessage}
            </SelectItem>
          ) : employees.length > 0 ? (
            <>
              {sortedEmployees
                .slice(0, debouncedSearchTerm ? undefined : 100) // Show first 100 if no search, all if searching
                .map(employee => (
                  <SelectItem
                    key={employee.id}
                    value={employee.id}
                    className="cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center w-full justify-between">
                      <div className="flex flex-col flex-1">
                        <span className="font-medium">
                          {employee.first_name} {employee.last_name}
                          {employee.file_number && (
                            <span className="text-blue-600 font-mono ml-1">
                              (File: {employee.file_number})
                            </span>
                          )}
                        </span>
                        {employee.is_external && employee.company_name && (
                          <span className="text-xs text-gray-500 mt-0.5">
                            Company: {employee.company_name}
                          </span>
                        )}
                      </div>
                      {employee.is_external && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-orange-100 text-orange-700 rounded whitespace-nowrap">
                          External
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              {!debouncedSearchTerm && employees.length > 100 && (
                <SelectItem value="more-employees" disabled className="text-center text-gray-500">
                  Showing first 100 of {employees.length} employees. Type to search for more.
                </SelectItem>
              )}
              {debouncedSearchTerm && sortedEmployees.length === 0 && (
                <SelectItem value="no-results" disabled>
                  No employees found
                </SelectItem>
              )}
            </>
          ) : (
            <SelectItem value="no-employees" disabled>
              No employees available
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {selectedEmployee && (
        <div className="text-xs text-gray-500">
          Selected: {selectedEmployee.first_name} {selectedEmployee.last_name}
          {selectedEmployee.is_external && (
            <span className="text-orange-600 ml-1">(External)</span>
          )}
          {selectedEmployee.is_external && selectedEmployee.company_name && (
            <span className="text-gray-600 ml-1">- {selectedEmployee.company_name}</span>
          )}
          {selectedEmployee.file_number && (
            <span className="text-blue-600"> (File: {selectedEmployee.file_number})</span>
          )}
        </div>
      )}
    </div>
  );
}

// Hook for using employee data with caching
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if employees are already cached
      const cachedEmployees = sessionStorage.getItem('employeesCache');
      const cacheTimestamp = sessionStorage.getItem('employeesCacheTimestamp');
      const now = Date.now();
      
      // Use cache if it's less than 5 minutes old
      if (cachedEmployees && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 300000) {
        const employeeData = JSON.parse(cachedEmployees);
        setEmployees(employeeData);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/employees/public?all=true&limit=1000', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const employeeData = data.data || data || [];
      
      // Cache the employees data
      sessionStorage.setItem('employeesCache', JSON.stringify(employeeData));
      sessionStorage.setItem('employeesCacheTimestamp', Date.now().toString());
      
      setEmployees(employeeData);
    } catch (err) {
      let errorMsg = 'Failed to load employees';
      if (err instanceof Error) {
        errorMsg = err.message;
      }

      setError(errorMsg);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  return { employees, loading, error, refetch: loadEmployees };
}
