import { useState, useCallback } from 'react';
import { erpnextClient, type Customer, type Employee, type Item } from '@/lib/erpnext-client';

interface UseERPNextReturn {
  // Connection
  testConnection: () => Promise<boolean>;
  connectionLoading: boolean;

  // Customers
  fetchCustomers: () => Promise<Customer[]>;
  createCustomer: (data: Partial<Customer>) => Promise<Customer | null>;
  customersLoading: boolean;

  // Employees
  fetchEmployees: () => Promise<Employee[]>;
  createEmployee: (data: Partial<Employee>) => Promise<Employee | null>;
  employeesLoading: boolean;

  // Items
  fetchItems: () => Promise<Item[]>;
  createItem: (data: Partial<Item>) => Promise<Item | null>;
  itemsLoading: boolean;

  // Error handling
  error: string | null;
  clearError: () => void;
}

export function useERPNext(): UseERPNextReturn {
  const [connectionLoading, setConnectionLoading] = useState(false);
  const [customersLoading, setCustomersLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setConnectionLoading(true);
    setError(null);

    try {
      const result = await erpnextClient.testConnection();
      return result.success || false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      setError(message);
      return false;
    } finally {
      setConnectionLoading(false);
    }
  }, []);

  const fetchCustomers = useCallback(async (): Promise<Customer[]> => {
    setCustomersLoading(true);
    setError(null);

    try {
      const customers = await erpnextClient.fetchAllCustomers();
      return customers;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch customers';
      setError(message);
      return [];
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const createCustomer = useCallback(async (data: Partial<Customer>): Promise<Customer | null> => {
    setCustomersLoading(true);
    setError(null);

    try {
      const customer = await erpnextClient.createOrUpdateCustomer(data);
      return customer;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create customer';
      setError(message);
      return null;
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(async (): Promise<Employee[]> => {
    setEmployeesLoading(true);
    setError(null);

    try {
      const employees = await erpnextClient.fetchAllEmployees();
      return employees;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch employees';
      setError(message);
      return [];
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const createEmployee = useCallback(async (data: Partial<Employee>): Promise<Employee | null> => {
    setEmployeesLoading(true);
    setError(null);

    try {
      const employee = await erpnextClient.createOrUpdateEmployee(data);
      return employee;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create employee';
      setError(message);
      return null;
    } finally {
      setEmployeesLoading(false);
    }
  }, []);

  const fetchItems = useCallback(async (): Promise<Item[]> => {
    setItemsLoading(true);
    setError(null);

    try {
      const items = await erpnextClient.fetchAllItems();
      return items;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch items';
      setError(message);
      return [];
    } finally {
      setItemsLoading(false);
    }
  }, []);

  const createItem = useCallback(async (data: Partial<Item>): Promise<Item | null> => {
    setItemsLoading(true);
    setError(null);

    try {
      const item = await erpnextClient.createOrUpdateItem(data);
      return item;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create item';
      setError(message);
      return null;
    } finally {
      setItemsLoading(false);
    }
  }, []);

  return {
    testConnection,
    connectionLoading,
    fetchCustomers,
    createCustomer,
    customersLoading,
    fetchEmployees,
    createEmployee,
    employeesLoading,
    fetchItems,
    createItem,
    itemsLoading,
    error,
    clearError,
  };
}
