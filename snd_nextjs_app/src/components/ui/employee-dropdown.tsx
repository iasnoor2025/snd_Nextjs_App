'use client';

import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import apiService from '@/lib/api';

export interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  designation?: string;
  hourly_rate?: number;
  employee_number?: string;
  file_number?: string;
  email?: string;
  phone?: string;
  department?: string;
  status?: string;
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
  placeholder = "Select an employee",
  disabled = false,
  label,
  required = false,
  showSearch = true,
  className = "",
  error,
  loading: externalLoading,
  onLoadingChange
}: EmployeeDropdownProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isLoading = externalLoading !== undefined ? externalLoading : loading;

  const loadEmployees = async () => {
    const currentLoading = true;
    setLoading(currentLoading);
    onLoadingChange?.(currentLoading);
    setErrorMessage(null);

    try {
      // Request all employees with a high limit to get all data
      const response = await apiService.get<{ data: Employee[] }>('/employees?limit=1000&per_page=1000');
      const employeeData = response.data || [];
      
      console.log(`Loaded ${employeeData.length} employees from database`);
      setEmployees(employeeData);
    } catch (error) {
      console.error('Error loading employees:', error);
      setErrorMessage('Failed to load employees. Please try again.');
      setEmployees([]);
    } finally {
      const currentLoading = false;
      setLoading(currentLoading);
      onLoadingChange?.(currentLoading);
    }
  };

  // Load employees when component mounts
  useEffect(() => {
    loadEmployees();
  }, []);

  // Filter employees based on search term
  const filteredEmployees = employees.filter(employee => 
    !searchTerm || 
    employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.file_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.id.toString().includes(searchTerm)
  );

  // Get selected employee for display
  const selectedEmployee = employees.find(emp => emp.id === value);

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <Label htmlFor="employee-select" className={required ? "after:content-['*'] after:ml-0.5 after:text-red-500" : ""}>
          {label}
        </Label>
      )}
      
      <Select
        value={value || ''}
        onValueChange={onValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger className={`w-full border ${error ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}>
          <SelectValue placeholder={isLoading ? "Loading employees..." : placeholder} />
        </SelectTrigger>
        
        <SelectContent className="max-h-96 overflow-y-auto">
          {/* Search Input */}
          {showSearch && (
            <div className="p-2 border-b sticky top-0 bg-white z-10">
              <input
                type="text"
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              {filteredEmployees
                .slice(0, searchTerm ? undefined : 100) // Show first 100 if no search, all if searching
                .map((employee) => (
                  <SelectItem key={employee.id} value={employee.id} className="cursor-pointer hover:bg-gray-100">
                    <div className="flex flex-col">
                      <span className="font-medium">{employee.first_name} {employee.last_name}</span>
                      <div className="flex gap-2 text-sm text-gray-500">
                        <span>{employee.designation}</span>
                        {employee.employee_number && <span>• {employee.employee_number}</span>}
                        {employee.file_number && <span>• {employee.file_number}</span>}
                        {employee.department && <span>• {employee.department}</span>}
                      </div>
                    </div>
                  </SelectItem>
                ))}
              {!searchTerm && employees.length > 100 && (
                <SelectItem value="more-employees" disabled className="text-center text-gray-500">
                  Showing first 100 of {employees.length} employees. Type to search for more.
                </SelectItem>
              )}
              {searchTerm && filteredEmployees.length === 0 && (
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
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {selectedEmployee && (
        <div className="text-xs text-gray-500">
          Selected: {selectedEmployee.first_name} {selectedEmployee.last_name}
          {selectedEmployee.employee_number && ` (${selectedEmployee.employee_number})`}
        </div>
      )}
    </div>
  );
}

// Hook for using employee data
export function useEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.get<{ data: Employee[] }>('/employees?limit=1000&per_page=1000');
      const employeeData = response.data || [];
      setEmployees(employeeData);
    } catch (err) {
      console.error('Error loading employees:', err);
      setError('Failed to load employees');
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  return { employees, loading, error, refetch: loadEmployees };
} 