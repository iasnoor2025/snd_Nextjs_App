import { useState, useCallback } from 'react';
import { ERPNextClient } from '@/lib/erpnext-client';

// Define types locally since they're not exported from erpnext-client
interface Customer {
  name: string;
  customer_name: string;
  customer_type: string;
  customer_group: string;
  territory: string;
  [key: string]: any;
}

interface Employee {
  name: string;
  employee_name: string;
  employee_number: string;
  department: string;
  designation: string;
  [key: string]: any;
}

interface Item {
  name: string;
  item_name: string;
  item_group: string;
  stock_uom: string;
  [key: string]: any;
}

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

  // Create a singleton instance
  const erpnextClient = new ERPNextClient();

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const testConnection = useCallback(async (): Promise<boolean> => {
    setConnectionLoading(true);
    setError(null);

    try {
      // Test connection by trying to fetch employees
      await erpnextClient.fetchAllEmployees();
      return true;
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
      // Note: fetchAllCustomers method doesn't exist in ERPNextClient
      // You'll need to implement this method in ERPNextClient
      throw new Error('fetchAllCustomers method not implemented');
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
      // Note: createOrUpdateCustomer method doesn't exist in ERPNextClient
      // You'll need to implement this method in ERPNextClient
      throw new Error('createOrUpdateCustomer method not implemented');
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
      // Note: createOrUpdateEmployee method doesn't exist in ERPNextClient
      // You'll need to implement this method in ERPNextClient
      throw new Error('createOrUpdateEmployee method not implemented');
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
      // Note: fetchAllItems method doesn't exist in ERPNextClient
      // You'll need to implement this method in ERPNextClient
      throw new Error('fetchAllItems method not implemented');
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
      // Note: createOrUpdateItem method doesn't exist in ERPNextClient
      // You'll need to implement this method in ERPNextClient
      throw new Error('createOrUpdateItem method not implemented');
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
