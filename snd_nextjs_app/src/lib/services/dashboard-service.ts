import { db } from '@/lib/drizzle';
import {
  customers,
  departments,
  designations,
  employeeAssignments,
  employeeDocuments,
  employeeLeaves,
  employees,
  equipment,
  projects,
  rentals,
  timesheets,
} from '@/lib/drizzle/schema';
import { and, count, desc, eq, gte, isNotNull, lte, sql } from 'drizzle-orm';
import { 
  cacheQueryResult, 
  generateCacheKey, 
  CACHE_TAGS, 
  CACHE_PREFIXES,
  invalidateCache 
} from '@/lib/redis';

export interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  totalProjects: number;
  availableEquipment: number;
  totalEquipment: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  activeRentals: number;
  totalRentals: number;
  totalCompanies: number;
  totalDocuments: number;
  equipmentUtilization: number;
  todayTimesheets: number;
  expiredDocuments: number;
  expiringDocuments: number;
  employeesOnLeave: number;
  // Financial metrics from ERPNext
  totalMoneyReceived: number;
  totalMoneyLost: number;
  monthlyMoneyReceived: number;
  monthlyMoneyLost: number;
  netProfit: number;
  currency: string;
}

export interface IqamaData {
  id: number;
  employeeName: string;
  fileNumber: string | null;
  iqamaNumber: string | null;
  expiryDate: string | null;
  daysRemaining: number | null;
  department: string | null;
  status: 'active' | 'expired' | 'expiring' | 'missing';
  nationality: string | null;
  position: string | null;
  companyName?: string | null;
  location?: string | null;
  // Additional document fields
  iqamaExpiry?: string | null;
  passportNumber?: string | null;
  passportExpiry?: string | null;
  drivingLicenseNumber?: string | null;
  drivingLicenseExpiry?: string | null;
  spspLicenseNumber?: string | null;
  spspLicenseExpiry?: string | null;
  operatorLicenseNumber?: string | null;
  operatorLicenseExpiry?: string | null;
  tuvCertificationNumber?: string | null;
  tuvCertificationExpiry?: string | null;
}

export interface EquipmentData {
  id: number;
  equipmentName: string;
  equipmentNumber: string | null;
  doorNumber?: string | null;
  istimara?: string | null;
  istimaraExpiry: string | null;
  daysRemaining: number | null;
  department: string | null;
  status: 'available' | 'expired' | 'expiring' | 'missing';
  manufacturer: string | null;
  modelNumber: string | null;
  serialNumber: string | null;
  categoryId?: number | null;
  assignedTo?: number | null;
  driverName?: string | null;
  driverFileNumber?: string | null;
}

export interface TimesheetData {
  id: number;
  employeeName: string;
  fileNumber: string | null;
  department: string | null;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  overtimeHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
  approvalStatus: string;
  date: string;
}

export interface DocumentData {
  id: number;
  documentType: string;
  employeeName: string;
  fileNumber: string | null;
  expiryDate: string | null;
  daysRemaining: number | null;
  status: 'valid' | 'expired' | 'expiring' | 'missing';
  department: string | null;
}

export interface LeaveRequest {
  id: number;
  employeeName: string;
  fileNumber: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  reason: string | null;
  department: string | null;
}

export interface ActiveRental {
  id: number;
  customerName: string | null;
  equipmentName: string | null;
  startDate: string;
  endDate: string | null;
  duration: number;
  dailyRate: number;
  totalAmount: string;
  status: string;
}

export interface ActiveProject {
  id: number;
  name: string;
  customer: string | null;
  startDate: string | null;
  endDate: string | null;
  progress: number;
  budget: string | null;
  spent: number;
  status: string;
  teamSize: number;
}

export interface RecentActivity {
  id: number;
  type: string;
  description: string | null;
  user: string | null;
  timestamp: string | null;
  severity: 'low' | 'medium' | 'high';
}

export class DashboardService {
  /**
   * Invalidate dashboard cache when relevant data changes
   */
  static async invalidateDashboardCache(): Promise<void> {
    await invalidateCache([CACHE_TAGS.DASHBOARD]);
  }

  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const today = new Date();

      // Run ALL queries in parallel for massive speed improvement!
      const [
        totalEmployeesResult,
        activeProjectsResult,
        totalProjectsResult,
        totalEquipmentResult,
        availableEquipmentResult,
        activeRentalsResult,
        totalRentalsResult,
        totalCompaniesResult,
        totalDocumentsResult,
      ] = await Promise.all([
        // Total employees count
        db.select({ count: count() })
          .from(employees)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Active projects count
        db.select({ count: count() })
          .from(projects)
          .where(sql`${projects.status} IN ('active', 'in_progress', 'ongoing', 'running')`)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Total projects count
        db.select({ count: count() })
          .from(projects)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Total equipment count
        db.select({ count: count() })
          .from(equipment)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Available equipment (simplified - using total for now)
        db.select({ count: count() })
          .from(equipment)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Active rentals count
        db.select({ count: count() })
          .from(rentals)
          .where(sql`${rentals.status} IN ('active', 'in_progress', 'ongoing', 'running', 'rented')`)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Total rentals count
        db.select({ count: count() })
          .from(rentals)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Total companies count
        db.select({ count: count() })
          .from(customers)
          .then(r => r[0] || { count: 0 })
          .catch(() => ({ count: 0 })),
        
        // Total documents count (placeholder)
        Promise.resolve({ count: 0 }),
      ]);

      const totalEmployees = totalEmployeesResult.count || 0;
      const activeProjects = activeProjectsResult.count || 0;
      const totalProjects = totalProjectsResult.count || 0;
      const totalEquipment = totalEquipmentResult.count || 0;
      const availableEquipment = availableEquipmentResult.count || 0;
      const activeRentals = activeRentalsResult.count || 0;
      const totalRentals = totalRentalsResult.count || 0;
      const totalCompanies = totalCompaniesResult.count || 0;
      const totalDocuments = totalDocumentsResult.count || 0;

      // Get today's timesheets
      let todayTimesheetsResult = { count: 0 };
      try {
        const todayStr: string = today.toISOString().split('T')[0] || '';
        if (todayStr) {
          const result = await db
            .select({ count: count() })
            .from(timesheets)
            .where(and(eq(timesheets.date, todayStr), eq(timesheets.status, 'pending')));
          todayTimesheetsResult = result[0] || { count: 0 };
        }
      } catch (error) {
        console.error('Error fetching today timesheets:', error);
      }

      // Get expired documents count
      let expiredDocumentsResult = { count: 0 };
      try {
        const result = await db
          .select({ count: count() })
          .from(employees)
          .where(
            and(isNotNull(employees.iqamaExpiry), lte(employees.iqamaExpiry, today.toISOString()))
          );
        expiredDocumentsResult = result[0] || { count: 0 };
      } catch (error) {
        console.error('Error fetching expired documents:', error);
      }

      // Get expiring documents count (within 30 days)
      let expiringDocumentsResult = { count: 0 };
      try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        const result = await db
          .select({ count: count() })
          .from(employees)
          .where(
            and(
              isNotNull(employees.iqamaExpiry),
              gte(employees.iqamaExpiry, today.toISOString()),
              lte(employees.iqamaExpiry, thirtyDaysFromNow.toISOString())
            )
          );
        expiringDocumentsResult = result[0] || { count: 0 };
      } catch (error) {
        console.error('Error fetching expiring documents:', error);
      }

      // Get pending approvals (timesheets pending approval)
      let pendingApprovalsResult = { count: 0 };
      try {
        const result = await db
          .select({ count: count() })
          .from(timesheets)
          .where(eq(timesheets.status, 'pending'));
        pendingApprovalsResult = result[0] || { count: 0 };
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
      }

      // Calculate monthly revenue (placeholder - you can implement actual calculation)
      const monthlyRevenue = 0;

      // Calculate equipment utilization
      const equipmentUtilization = totalEquipment > 0 
        ? Math.round((availableEquipment / totalEquipment) * 100)
        : 0;

      // Get financial metrics from ERPNext
      let financialMetrics = {
        totalMoneyReceived: 0,
        totalMoneyLost: 0,
        monthlyMoneyReceived: 0,
        monthlyMoneyLost: 0,
        netProfit: 0,
        currency: 'SAR',
      };

      try {
        const { ERPNextFinancialService } = await import('./erpnext-financial-service');
        financialMetrics = await ERPNextFinancialService.getFinancialMetrics();
        financialMetrics.netProfit =
          financialMetrics.totalMoneyReceived - financialMetrics.totalMoneyLost;
      } catch (error) {
        console.error('Error fetching financial metrics from ERPNext:', error);
        // Use default values if ERPNext is not available
      }

      // Get employees currently on leave
      let employeesCurrentlyOnLeave: any[] = [];
      try {
        employeesCurrentlyOnLeave = await this.getEmployeesCurrentlyOnLeave();
      } catch (error) {
        console.error('Error fetching employees on leave:', error);
        employeesCurrentlyOnLeave = [];
      }

      return {
        totalEmployees,
        activeProjects,
        totalProjects,
        availableEquipment,
        totalEquipment,
        monthlyRevenue: 0,
        pendingApprovals: pendingApprovalsResult.count || 0,
        activeRentals,
        totalRentals,
        totalCompanies,
        totalDocuments,
        equipmentUtilization: totalEquipment > 0 
          ? Math.round((availableEquipment / totalEquipment) * 100)
          : 0,
        todayTimesheets: todayTimesheetsResult.count || 0,
        expiredDocuments: expiredDocumentsResult.count || 0,
        expiringDocuments: expiringDocumentsResult.count || 0,
        employeesOnLeave: employeesCurrentlyOnLeave.length || 0,
        // Financial metrics
        totalMoneyReceived: financialMetrics.totalMoneyReceived || 0,
        totalMoneyLost: financialMetrics.totalMoneyLost || 0,
        monthlyMoneyReceived: financialMetrics.monthlyMoneyReceived || 0,
        monthlyMoneyLost: financialMetrics.monthlyMoneyLost || 0,
        netProfit: financialMetrics.netProfit || 0,
        currency: financialMetrics.currency || 'SAR',
      };
    } catch (error) {
      console.error('Error in getDashboardStats:', error);
      throw error;
    }
  }

  static async getTotalEquipmentCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(equipment);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching total equipment count:', error);
      return 0;
    }
  }

  static async getAvailableEquipmentCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(equipment)
        .where(eq(equipment.status, 'available'));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching available equipment count:', error);
      return 0;
    }
  }

  static async getTotalCompaniesCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(customers)
        .where(eq(customers.status, 'active'));
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching total companies count:', error);
      return 0;
    }
  }

  static async getTotalDocumentsCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(employeeDocuments);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching total documents count:', error);
      return 0;
    }
  }

  static async getTotalProjectsCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(projects);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching total projects count:', error);
      return 0;
    }
  }

  static async getTotalRentalsCount(): Promise<number> {
    try {
      const result = await db
        .select({ count: count() })
        .from(rentals);
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error fetching total rentals count:', error);
      return 0;
    }
  }

  static async debugProjectAndRentalData(): Promise<void> {
    try {
      // Debug projects
      const allProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          status: projects.status,
        })
        .from(projects)
        .limit(10);

      // Debug rentals
      const allRentals = await db
        .select({
          id: rentals.id,
          equipmentName: rentals.equipmentName,
          status: rentals.status,
        })
        .from(rentals)
        .limit(10);
    } catch (error) {
      console.error('Error debugging project and rental data:', error);
    }
  }

  static async getIqamaData(limit: number = 50): Promise<IqamaData[]> {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      const iqamaData = await db
        .select({
          id: employees.id,
          employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          fileNumber: employees.fileNumber,
          iqamaNumber: employees.iqamaNumber,
          expiryDate: employees.iqamaExpiry,
          nationality: employees.nationality,
          position: designations.name,
          department: departments.name,
          companyName: sql<string>`'Company Name'`, // Placeholder - you can update this with actual company field
          location: sql<string>`'Location'`, // Placeholder - you can update this with actual location field
          // Additional document fields
          passportNumber: employees.passportNumber,
          passportExpiry: employees.passportExpiry,
          drivingLicenseNumber: employees.drivingLicenseNumber,
          drivingLicenseExpiry: employees.drivingLicenseExpiry,
          spspLicenseNumber: employees.spspLicenseNumber,
          spspLicenseExpiry: employees.spspLicenseExpiry,
          operatorLicenseNumber: employees.operatorLicenseNumber,
          operatorLicenseExpiry: employees.operatorLicenseExpiry,
          tuvCertificationNumber: employees.tuvCertificationNumber,
          tuvCertificationExpiry: employees.tuvCertificationExpiry,
          // Map database fields to component field names
          iqamaExpiry: employees.iqamaExpiry,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .leftJoin(designations, eq(employees.designationId, designations.id))
        .where(eq(employees.status, 'active'))
        .limit(limit);

      return iqamaData.map(employee => {
        let status: 'active' | 'expired' | 'expiring' | 'missing' = 'active';
        let daysRemaining: number | null = null;

        if (!employee.expiryDate) {
          status = 'missing';
        } else {
          const expiryDate = new Date(employee.expiryDate);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            status = 'expired';
            daysRemaining = diffDays; // Keep negative for expired items
          } else if (diffDays <= 30) {
            status = 'expiring';
            daysRemaining = diffDays;
          } else {
            daysRemaining = diffDays;
          }
        }

        return {
          ...employee,
          status,
          daysRemaining,
        };
      });
    } catch (error) {
      
      throw error;
    }
  }

  static async getEquipmentData(limit: number = 50): Promise<EquipmentData[]> {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Fetch equipment data with assigned driver/operator information using JOIN
      const equipmentData = await db
        .select({
          id: equipment.id,
          equipmentName: equipment.name,
          equipmentNumber: equipment.doorNumber,
          doorNumber: equipment.doorNumber,
          istimara: equipment.istimara,
          istimaraExpiry: equipment.istimaraExpiryDate,
          manufacturer: equipment.manufacturer,
          modelNumber: equipment.modelNumber,
          serialNumber: equipment.serialNumber,
          categoryId: equipment.categoryId,
          assignedTo: equipment.assignedTo,
          driverName: sql<string>`CONCAT(${employees.firstName}, ' ', COALESCE(${employees.middleName}, ''), ' ', ${employees.lastName})`.as('driverName'),
          driverFileNumber: employees.fileNumber,
          department: sql<string>`NULL`.as('department'),
        })
        .from(equipment)
        .leftJoin(employees, eq(equipment.assignedTo, employees.id))
        .limit(limit);



      const result = equipmentData.map(doc => {
        let status: 'available' | 'expired' | 'expiring' | 'missing' = 'available';
        let daysRemaining: number | null = null;

        // Check if istimara number exists
        if (!doc.istimara) {
          status = 'missing';
          daysRemaining = null;
        } else if (!doc.istimaraExpiry) {
          // Has istimara but no expiry date - mark as missing expiry
          status = 'missing';
          daysRemaining = null;
        } else {
          const expiryDate = new Date(doc.istimaraExpiry);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            status = 'expired';
            daysRemaining = diffDays; // Keep negative for expired items
          } else if (diffDays <= 30) {
            status = 'expiring';
            daysRemaining = diffDays;
          } else {
            // Valid istimara with future expiry date
            status = 'available';
            daysRemaining = diffDays;
          }
        }

        return {
          id: doc.id,
          equipmentName: doc.equipmentName || 'Unknown',
          equipmentNumber: doc.equipmentNumber || 'N/A',
          doorNumber: doc.doorNumber || null,
          istimara: doc.istimara || null,
          istimaraExpiry: doc.istimaraExpiry,
          department: null, // Equipment doesn't have department in current schema
          status: status,
          daysRemaining: daysRemaining,
          manufacturer: doc.manufacturer,
          modelNumber: doc.modelNumber,
          serialNumber: doc.serialNumber,
          categoryId: doc.categoryId || null,
          assignedTo: doc.assignedTo || null,
          driverName: doc.driverName || null,
          driverFileNumber: doc.driverFileNumber || null,
        };
      });

      return result;
    } catch (error) {
      console.error('Error in getEquipmentData:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
      // Return empty array instead of throwing to prevent dashboard crash
      return [];
    }
  }

  static async getTodayTimesheets(limit: number = 50): Promise<TimesheetData[]> {
    try {
      const today = new Date();
      const todayStr: string = today.toISOString().split('T')[0];

      const timesheetData = await db
        .select({
          id: timesheets.id,
          employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          fileNumber: employees.fileNumber,
          department: departments.name,
          checkIn: timesheets.startTime,
          checkOut: timesheets.endTime,
          totalHours: timesheets.hoursWorked,
          overtimeHours: timesheets.overtimeHours,
          approvalStatus: timesheets.status,
          date: timesheets.date,
        })
        .from(timesheets)
        .innerJoin(employees, eq(timesheets.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(timesheets.date, todayStr))
        .limit(limit);

      return timesheetData.map(timesheet => {
        let status: 'present' | 'absent' | 'late' | 'half-day' = 'present';

        if (!timesheet.checkIn && !timesheet.checkOut) {
          status = 'absent';
        } else if (timesheet.checkIn && !timesheet.checkOut) {
          status = 'half-day';
        } else if (timesheet.checkIn) {
          const checkInTime = new Date(timesheet.checkIn);
          const workStartTime = new Date();
          workStartTime.setHours(8, 0, 0, 0);

          if (checkInTime > workStartTime) {
            status = 'late';
          }
        }

        return {
          ...timesheet,
          status,
          totalHours: Number(timesheet.totalHours) || 0,
          overtimeHours: Number(timesheet.overtimeHours) || 0,
        };
      });
    } catch (error) {
      
      throw error;
    }
  }

  static async getExpiringDocuments(limit: number = 50): Promise<DocumentData[]> {
    try {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Get employees with expiring documents
      const documentData = await db
        .select({
          id: employees.id,
          documentType: sql<string>`'Iqama'`,
          employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          fileNumber: employees.fileNumber,
          expiryDate: employees.iqamaExpiry,
          department: departments.name,
        })
        .from(employees)
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(
          and(
            isNotNull(employees.iqamaExpiry),
            gte(employees.iqamaExpiry, today.toISOString()),
            lte(employees.iqamaExpiry, thirtyDaysFromNow.toISOString())
          )
        )
        .limit(limit);

      return documentData.map(doc => {
        let status: 'valid' | 'expired' | 'expiring' | 'missing' = 'valid';
        let daysRemaining: number | null = null;

        if (!doc.expiryDate) {
          status = 'missing';
        } else {
          const expiryDate = new Date(doc.expiryDate);
          const diffTime = expiryDate.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            status = 'expired';
            daysRemaining = diffDays; // Keep negative for expired items
          } else if (diffDays <= 30) {
            status = 'expiring';
            daysRemaining = diffDays;
          } else {
            daysRemaining = diffDays;
          }
        }

        return {
          ...doc,
          status,
          daysRemaining,
        };
      });
    } catch (error) {
      
      throw error;
    }
  }

  static async getActiveLeaveRequests(limit: number = 50): Promise<LeaveRequest[]> {
    try {
      const leaveData = await db
        .select({
          id: employeeLeaves.id,
          employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          fileNumber: employees.fileNumber,
          leaveType: employeeLeaves.leaveType,
          startDate: employeeLeaves.startDate,
          endDate: employeeLeaves.endDate,
          days: employeeLeaves.days,
          status: employeeLeaves.status,
          reason: employeeLeaves.reason,
          department: departments.name,
        })
        .from(employeeLeaves)
        .innerJoin(employees, eq(employeeLeaves.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(eq(employeeLeaves.status, 'pending'))
        .limit(limit);

      return leaveData;
    } catch (error) {
      
      throw error;
    }
  }

  static async getEmployeesCurrentlyOnLeave(): Promise<LeaveRequest[]> {
    try {
      const today = new Date();
      const todayStr: string = today.toISOString().split('T')[0];

      const leaveData = await db
        .select({
          id: employeeLeaves.id,
          employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          fileNumber: employees.fileNumber,
          leaveType: employeeLeaves.leaveType,
          startDate: employeeLeaves.startDate,
          endDate: employeeLeaves.endDate,
          days: employeeLeaves.days,
          status: employeeLeaves.status,
          reason: employeeLeaves.reason,
          department: departments.name,
        })
        .from(employeeLeaves)
        .innerJoin(employees, eq(employeeLeaves.employeeId, employees.id))
        .leftJoin(departments, eq(employees.departmentId, departments.id))
        .where(
          and(
            eq(employeeLeaves.status, 'approved'),
            lte(employeeLeaves.startDate, todayStr),
            gte(employeeLeaves.endDate, todayStr)
          )
        );

      return leaveData;
    } catch (error) {
      
      // Return empty array instead of throwing to prevent dashboard from failing
      return [];
    }
  }

  static async getActiveRentals(limit: number = 50): Promise<ActiveRental[]> {
    try {
      const rentalData = await db
        .select({
          id: rentals.id,
          customerName: customers.name,
          equipmentName: rentals.equipmentName,
          startDate: rentals.startDate,
          endDate: rentals.expectedEndDate,
          totalAmount: rentals.totalAmount,
          status: rentals.status,
        })
        .from(rentals)
        .leftJoin(customers, eq(rentals.customerId, customers.id))
        .where(eq(rentals.status, 'active'))
        .limit(limit);

      return rentalData.map(rental => {
        // Calculate duration in days
        let duration = 0;
        if (rental.startDate && rental.endDate) {
          const start = new Date(rental.startDate);
          const end = new Date(rental.endDate);
          const diffTime = end.getTime() - start.getTime();
          duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }

        // Use a default daily rate for now
        const dailyRate = 100; // Default daily rate

        return {
          ...rental,
          duration,
          dailyRate,
        };
      });
    } catch (error) {
      
      // Return empty array instead of throwing to prevent dashboard from failing
      return [];
    }
  }

  static async getActiveProjects(limit: number = 50): Promise<ActiveProject[]> {
    try {
      // First, let's check if we have any projects at all
      const totalProjects = await db.select({ count: count() }).from(projects);

      // Get all projects (not just active ones) to see what we have
      const allProjects = await db
        .select({
          id: projects.id,
          name: projects.name,
          customer: customers.name,
          startDate: projects.startDate,
          endDate: projects.endDate,
          budget: projects.budget,
          status: projects.status,
        })
        .from(projects)
        .leftJoin(customers, eq(projects.customerId, customers.id))
        .limit(limit);


      // If no projects exist, return empty array
      if (allProjects.length === 0) {
        return [];
      }

      // Get projects with team size calculation
      const projectData = await db
        .select({
          id: projects.id,
          name: projects.name,
          customer: customers.name,
          startDate: projects.startDate,
          endDate: projects.endDate,
          budget: projects.budget,
          status: projects.status,
          teamSize: sql<number>`(
            SELECT COUNT(*) FROM ${employeeAssignments} 
            WHERE ${employeeAssignments.projectId} = ${projects.id} 
            AND ${employeeAssignments.status} = 'active'
          )`,
        })
        .from(projects)
        .leftJoin(customers, eq(projects.customerId, customers.id))
        .limit(limit);

      return projectData.map(project => {
        // Calculate progress based on dates
        let progress = 0;
        if (project.startDate && project.endDate) {
          const start = new Date(project.startDate);
          const end = new Date(project.endDate);
          const today = new Date();

          if (today >= start && today <= end) {
            const totalDuration = end.getTime() - start.getTime();
            const elapsed = today.getTime() - start.getTime();
            progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);
          } else if (today > end) {
            progress = 100;
          }
        }

        // Calculate spent amount (placeholder - you can implement actual calculation)
        const spent = 0;

        return {
          ...project,
          progress,
          spent,
          // Ensure teamSize is always a number
          teamSize: Number(project.teamSize) || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching projects:', error);
      // Return empty array instead of throwing to prevent dashboard from failing
      return [];
    }
  }

  static async getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
    try {
      const allActivities: any[] = [];

      // Get recent timesheet submissions and approvals
      const recentTimesheets = await db
        .select({
          id: timesheets.id,
          type: sql<string>`'Timesheet Submission'`,
          description: sql<string>`CONCAT('Timesheet submitted for ', ${timesheets.date})`,
          user: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          timestamp: timesheets.submittedAt,
          severity: sql<string>`'low'`,
        })
        .from(timesheets)
        .innerJoin(employees, eq(timesheets.employeeId, employees.id))
        .where(isNotNull(timesheets.submittedAt))
        .orderBy(desc(timesheets.submittedAt))
        .limit(Math.ceil(limit * 0.2));

      // Get recent timesheet approvals (status changes)
      const recentTimesheetApprovals = await db
        .select({
          id: timesheets.id,
          type: sql<string>`'Timesheet Approval'`,
          description: sql<string>`CONCAT('Timesheet ', ${timesheets.status}, ' for ', ${timesheets.date})`,
          user: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          timestamp: timesheets.updatedAt || timesheets.createdAt,
          severity: sql<string>`'medium'`,
        })
        .from(timesheets)
        .innerJoin(employees, eq(timesheets.employeeId, employees.id))
        .where(
          and(
            isNotNull(timesheets.status),
            sql`${timesheets.status} IN ('foreman_approved', 'incharge_approved', 'checking_approved', 'manager_approved', 'rejected')`,
            isNotNull(timesheets.updatedAt) // Only get timesheets that have been updated (approved)
          )
        )
        .orderBy(desc(timesheets.updatedAt))
        .limit(Math.ceil(limit * 0.1));

      // Get recent leave requests
      const recentLeaves = await db
        .select({
          id: employeeLeaves.id,
          type: sql<string>`'Leave Request'`,
          description: sql<string>`CONCAT('Leave request for ', ${employeeLeaves.leaveType})`,
          user: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          timestamp: employeeLeaves.createdAt,
          severity: sql<string>`'medium'`,
        })
        .from(employeeLeaves)
        .innerJoin(employees, eq(employeeLeaves.employeeId, employees.id))
        .orderBy(desc(employeeLeaves.createdAt))
        .limit(Math.ceil(limit * 0.2));

      // Get recent equipment assignments
      const recentEquipmentAssignments = await db
        .select({
          id: employeeAssignments.id,
          type: sql<string>`'Equipment Assignment'`,
          description: sql<string>`CONCAT('Equipment assigned to ', ${employees.firstName}, ' ', ${employees.lastName})`,
          user: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          timestamp: employeeAssignments.createdAt,
          severity: sql<string>`'low'`,
        })
        .from(employeeAssignments)
        .innerJoin(employees, eq(employeeAssignments.employeeId, employees.id))
        .where(eq(employeeAssignments.type, 'equipment'))
        .orderBy(desc(employeeAssignments.createdAt))
        .limit(Math.ceil(limit * 0.15));

      // Get recent project assignments
      const recentProjectAssignments = await db
        .select({
          id: employeeAssignments.id,
          type: sql<string>`'Project Assignment'`,
          description: sql<string>`CONCAT('Project assignment for ', ${employees.firstName}, ' ', ${employees.lastName})`,
          user: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          timestamp: employeeAssignments.createdAt,
          severity: sql<string>`'medium'`,
        })
        .from(employeeAssignments)
        .innerJoin(employees, eq(employeeAssignments.employeeId, employees.id))
        .where(eq(employeeAssignments.type, 'project'))
        .orderBy(desc(employeeAssignments.createdAt))
        .limit(Math.ceil(limit * 0.15));

      // Get recent document updates (from employee documents)
      const recentDocumentUpdates = await db
        .select({
          id: employeeDocuments.id,
          type: sql<string>`'Document Update'`,
          description: sql<string>`CONCAT('Document updated: ', ${employeeDocuments.documentType})`,
          user: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          timestamp: employeeDocuments.updatedAt,
          severity: sql<string>`'low'`,
        })
        .from(employeeDocuments)
        .innerJoin(employees, eq(employeeDocuments.employeeId, employees.id))
        .orderBy(desc(employeeDocuments.updatedAt))
        .limit(Math.ceil(limit * 0.1));

      // Get recent rental activities
      const recentRentals = await db
        .select({
          id: rentals.id,
          type: sql<string>`'Rental Activity'`,
          description: sql<string>`CONCAT('Rental ', ${rentals.status}, ': ', ${rentals.equipmentName})`,
          user: sql<string>`'System'`,
          timestamp: rentals.createdAt,
          severity: sql<string>`'medium'`,
        })
        .from(rentals)
        .orderBy(desc(rentals.createdAt))
        .limit(Math.ceil(limit * 0.1));

      // Get recent maintenance activities
      const recentMaintenance = await db
        .select({
          id: sql<number>`0`, // Placeholder since maintenance table might not exist
          type: sql<string>`'Maintenance'`,
          description: sql<string>`'Equipment maintenance scheduled'`,
          user: sql<string>`'System'`,
          timestamp: sql<string>`CURRENT_TIMESTAMP`,
          severity: sql<string>`'high'`,
        })
        .from(employees)
        .limit(1); // Just to get one record for the query structure

      // Combine all activities
      allActivities.push(
        ...recentTimesheets,
        ...recentTimesheetApprovals,
        ...recentLeaves,
        ...recentEquipmentAssignments,
        ...recentProjectAssignments,
        ...recentDocumentUpdates,
        ...recentRentals
      );

      // Sort by timestamp and limit
      const sortedActivities = allActivities
        .filter(activity => activity.timestamp) // Filter out activities without timestamps
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit)
        .map((activity, index) => ({
          ...activity,
          id: index + 1,
          severity: activity.severity as 'low' | 'medium' | 'high',
        }));

      // Debug: Log the activities being returned

      return sortedActivities;
    } catch (error) {
      
      // Return empty array instead of throwing to prevent dashboard from failing
      return [];
    }
  }
}
