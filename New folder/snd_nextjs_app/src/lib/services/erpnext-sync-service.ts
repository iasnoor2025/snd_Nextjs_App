import { ERPNextClient } from '@/lib/erpnext-client';
import { db } from '@/lib/db';
import { departments, designations } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export interface ERPNextSyncResult {
  success: boolean;
  message: string;
  erpnextId?: string | null;
}

export class ERPNextSyncService {
  private static instance: ERPNextSyncService;
  private erpnextClient: ERPNextClient | null = null;

  private constructor() {
    // Check if ERPNext environment variables are configured
    if (process.env.NEXT_PUBLIC_ERPNEXT_URL && 
        process.env.NEXT_PUBLIC_ERPNEXT_API_KEY && 
        process.env.NEXT_PUBLIC_ERPNEXT_API_SECRET) {
      this.erpnextClient = new ERPNextClient();
    }
  }

  public static getInstance(): ERPNextSyncService {
    if (!ERPNextSyncService.instance) {
      ERPNextSyncService.instance = new ERPNextSyncService();
    }
    return ERPNextSyncService.instance;
  }

  /**
   * Check if ERPNext sync is available
   */
  public isAvailable(): boolean {
    return this.erpnextClient !== null;
  }

  /**
   * Sync employee data to ERPNext after creation
   */
  public async syncNewEmployee(employee: any): Promise<string | null> {
    if (!this.isAvailable()) {
      console.log('⚠️ ERPNext sync service not available, skipping sync');
      return null;
    }

    try {
      console.log('🔄 ERPNext Sync Service - Syncing new employee:', {
        fileNumber: employee.fileNumber,
        firstName: employee.firstName,
        lastName: employee.lastName
      });

      const erpnextClient = new ERPNextClient();
      const erpnextId = await erpnextClient.createEmployee(employee);

      if (erpnextId) {
        console.log('✅ ERPNext Sync Service - New employee created successfully:', erpnextId);
      } else {
        console.log('❌ ERPNext Sync Service - New employee creation failed');
      }

      return erpnextId;
    } catch (error) {
      console.error('💥 ERPNext Sync Service Error:', error);
      return null;
    }
  }

  /**
   * Sync employee data to ERPNext after update
   */
  public async syncUpdatedEmployee(employee: any, departmentName?: string, designationName?: string): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('⚠️ ERPNext sync service not available, skipping sync');
      return false;
    }

    try {
      console.log('🔄 ERPNext Sync Service - Syncing updated employee:', {
        id: employee.id,
        fileNumber: employee.fileNumber,
        firstName: employee.firstName,
        lastName: employee.lastName
      });

      // Use the enhanced update method that handles employee number changes
      const erpnextClient = new ERPNextClient();
      const success = await erpnextClient.updateEmployeeWithRename(employee);

      if (success) {
        console.log('✅ ERPNext Sync Service - Employee updated successfully');
      } else {
        console.log('❌ ERPNext Sync Service - Employee update failed');
      }

      return success;
    } catch (error) {
      console.error('💥 ERPNext Sync Service Error:', error);
      return false;
    }
  }

  /**
   * Sync employee data to ERPNext after deletion (mark as inactive)
   */
  public async syncDeletedEmployee(employee: any): Promise<boolean> {
    if (!this.isAvailable()) {
      console.log('⚠️ ERPNext sync service not available, skipping sync');
      return false;
    }

    try {
      console.log('🔄 ERPNext Sync Service - Syncing deleted employee:', {
        id: employee.id,
        fileNumber: employee.fileNumber,
        firstName: employee.firstName,
        lastName: employee.lastName
      });

      const erpnextClient = new ERPNextClient();
      const success = await erpnextClient.updateEmployee({
        ...employee,
        status: 'inactive'
      });

      if (success) {
        console.log('✅ ERPNext Sync Service - Employee marked as inactive successfully');
      } else {
        console.log('❌ ERPNext Sync Service - Employee status update failed');
      }

      return success;
    } catch (error) {
      console.error('💥 ERPNext Sync Service Error:', error);
      return false;
    }
  }
}
