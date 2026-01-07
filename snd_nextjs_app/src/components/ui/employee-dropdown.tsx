'use client';

import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import React, { useEffect, useState, useMemo, useCallback, memo } from 'react';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  designation?: string | { name: string };
  hourly_rate?: number;
  employee_number?: string;
  file_number?: string;
  iqama_number?: string;
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
  projectId?: number | string; // If provided, only show employees from project manpower
  hideSelectedText?: boolean;
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
  projectId,
  hideSelectedText = false,
}: EmployeeDropdownProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  const loadEmployees = useCallback(async () => {
    const currentLoading = true;
    setLoading(currentLoading);
    onLoadingChange?.(currentLoading);
    setErrorMessage(null);

    try {
      // If projectId is provided, load from project manpower instead
      if (projectId) {
        const response = await fetch(`/api/projects/${projectId}/manpower`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const manpowerData = data.data || data || [];

        // Transform manpower data to employee format
        const employeeData = manpowerData.map((item: any) => ({
          id: item.employeeId?.toString() || item.id?.toString(),
          first_name: item.employeeFirstName || item.workerName?.split(' ')[0] || '',
          last_name: item.employeeLastName || item.workerName?.split(' ').slice(1).join(' ') || '',
          file_number: item.employeeFileNumber || '',
          designation: item.jobTitle || '',
          employee_number: item.employeeFileNumber || '',
        })).filter((emp: any) => emp.id); // Filter out entries without employee ID

        if (employeeData.length === 0) {
          setErrorMessage('No employees assigned to this project. Add manpower first.');
        }

        setEmployees(employeeData);
        setLoading(false);
        onLoadingChange?.(false);
        return;
      }

      // Check if employees are already cached (only for non-project-specific requests)
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

      // Use the dropdown API endpoint that returns all employees (internal and external)
      const response = await fetch('/api/employees/dropdown?all=true&limit=1000', {
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
  }, [onLoadingChange, projectId]);

  // Load employees when component mounts
  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);


  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

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
      
      // Check iqama number
      if (employee.iqama_number?.toLowerCase().includes(searchLower)) return true;
      
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
  // Use slice() to avoid mutating the original array
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
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

  // Get selected employee for display - ensure string comparison
  const selectedEmployee = employees.find(emp => String(emp.id) === String(value));

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

      <Select 
        value={value || undefined} 
        onValueChange={onValueChange} 
        disabled={disabled || isLoading}
        onOpenChange={(open) => {
          setIsOpen(open);
          // Reset search when dropdown closes
          if (!open) {
            if (debounceTimerRef.current) {
              clearTimeout(debounceTimerRef.current);
            }
            setSearchTerm('');
            setDebouncedSearchTerm('');
          }
        }}
      >
        <SelectTrigger
          className={cn(
            'w-full',
            error ? 'border-red-500' : 'border-gray-300',
            'rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          )}
        >
          <SelectValue 
            placeholder={isLoading ? 'Loading employees...' : placeholder}
            className="truncate"
          >
            {selectedEmployee ? (
              `${selectedEmployee.first_name} ${selectedEmployee.last_name}${selectedEmployee.file_number ? ` (File: ${selectedEmployee.file_number})` : ''}`
            ) : value ? (
              // Fallback: show value if employee not found yet (while loading)
              `Loading...`
            ) : null}
          </SelectValue>
        </SelectTrigger>

        <SelectContent className="max-h-96 overflow-y-auto">
          {/* Search Input */}
          {showSearch && (
            <div 
              className="p-2 border-b sticky top-0 bg-white z-10"
              onPointerDown={(e) => {
                // Prevent SelectContent from closing when clicking in search area
                e.preventDefault();
              }}
              onMouseDown={(e) => {
                // Prevent SelectContent from closing when clicking in search area
                e.preventDefault();
              }}
            >
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => {
                  const newValue = e.target.value;
                  
                  // Update searchTerm immediately for display in input field
                  setSearchTerm(newValue);
                  
                  // Clear existing timer if it exists
                  if (debounceTimerRef.current !== null) {
                    clearTimeout(debounceTimerRef.current);
                    debounceTimerRef.current = null;
                  }
                  
                  // Set new timer - only update debouncedSearchTerm after 300ms of no typing
                  debounceTimerRef.current = setTimeout(() => {
                    setDebouncedSearchTerm(newValue);
                    debounceTimerRef.current = null;
                  }, 300);
                }}
                onKeyDown={(e) => {
                  // Only stop propagation for Escape key to prevent dropdown from closing
                  if (e.key === 'Escape') {
                    e.stopPropagation();
                  }
                  // Allow all other keys to work normally
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  // Ensure input maintains focus
                  if (searchInputRef.current) {
                    searchInputRef.current.focus();
                  }
                }}
                onFocus={(e) => {
                  e.stopPropagation();
                }}
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
                .map(employee => {
                  // Simple text for display and search - this is what appears in SelectValue
                  const displayText = `${employee.first_name} ${employee.last_name}${
                    employee.file_number ? ` (File: ${employee.file_number})` : ''
                  }`;

                  return (
                    <SelectItem
                      key={employee.id}
                      value={employee.id}
                      className="cursor-pointer hover:bg-gray-100"
                      textValue={displayText}
                    >
                      {displayText}
                    </SelectItem>
                  );
                })}
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

      {selectedEmployee && !hideSelectedText && (
        <div className="text-xs text-gray-500 mt-1 break-words">
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

      const response = await fetch('/api/employees/dropdown?all=true&limit=1000', {
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
