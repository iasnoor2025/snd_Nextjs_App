import { db } from '@/lib/drizzle';
import { 
  employees, 
  timesheets, 
  employeeAssignments, 
  rentals, 
  projects, 
  companies,
  customers,
  equipment,
  employeeLeaves,
  employeeDocuments,
  users,
  departments,
  designations
} from '@/lib/drizzle/schema';
import { eq, and, gte, lte, isNull, isNotNull, count, sql, desc, asc } from 'drizzle-orm';

export interface DashboardStats {
  totalEmployees: number;
  activeProjects: number;
  availableEquipment: number;
  monthlyRevenue: number;
  pendingApprovals: number;
  activeRentals: number;
  totalCustomers: number;
  equipmentUtilization: number;
  todayTimesheets: number;
  expiredDocuments: number;
  expiringDocuments: number;
  employeesOnLeave: number;
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
}

export interface TimesheetData {
  id: number;
  employeeName: string;
  fileNumber: string | null;
  department: string | null;
  checkIn: string | null;
  checkOut: string | null;
  totalHours: number;
  status: 'present' | 'absent' | 'late' | 'half-day';
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
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      // Get total employees
      let totalEmployeesResult = { count: 0 };
      try {
        [totalEmployeesResult] = await db
          .select({ count: count() })
          .from(employees)
          .where(eq(employees.status, 'active'));
      } catch (error) {
        console.error('Error fetching total employees:', error);
      }

      // Get active projects
      let activeProjectsResult = { count: 0 };
      try {
        [activeProjectsResult] = await db
          .select({ count: count() })
          .from(projects)
          .where(eq(projects.status, 'active'));
      } catch (error) {
        console.error('Error fetching active projects:', error);
      }

      // Get active rentals
      let activeRentalsResult = { count: 0 };
      try {
        [activeRentalsResult] = await db
          .select({ count: count() })
          .from(rentals)
          .where(eq(rentals.status, 'active'));
      } catch (error) {
        console.error('Error fetching active rentals:', error);
      }

      // Get today's timesheets
      let todayTimesheetsResult = { count: 0 };
      try {
        [todayTimesheetsResult] = await db
          .select({ count: count() })
          .from(timesheets)
          .where(
            and(
              eq(timesheets.date, today.toISOString().split('T')[0]),
              eq(timesheets.status, 'pending')
            )
          );
      } catch (error) {
        console.error('Error fetching today timesheets:', error);
      }

      // Get expired documents count
      let expiredDocumentsResult = { count: 0 };
      try {
        [expiredDocumentsResult] = await db
          .select({ count: count() })
          .from(employees)
          .where(
            and(
              isNotNull(employees.iqamaExpiry),
              lte(employees.iqamaExpiry, today.toISOString())
            )
          );
      } catch (error) {
        console.error('Error fetching expired documents:', error);
      }

      // Get expiring documents count (within 30 days)
      let expiringDocumentsResult = { count: 0 };
      try {
        const thirtyDaysFromNow = new Date();
        thirtyDaysFromNow.setDate(today.getDate() + 30);
        [expiringDocumentsResult] = await db
          .select({ count: count() })
          .from(employees)
          .where(
            and(
              isNotNull(employees.iqamaExpiry),
              gte(employees.iqamaExpiry, today.toISOString()),
              lte(employees.iqamaExpiry, thirtyDaysFromNow.toISOString())
            )
          );
      } catch (error) {
        console.error('Error fetching expiring documents:', error);
      }

      // Get total customers
      let totalCustomersResult = { count: 0 };
      try {
        [totalCustomersResult] = await db
          .select({ count: count() })
          .from(customers)
          .where(eq(customers.status, 'active'));
      } catch (error) {
        console.error('Error fetching total customers:', error);
      }

      // Get available equipment
      let availableEquipmentResult = { count: 0 };
      try {
        [availableEquipmentResult] = await db
          .select({ count: count() })
          .from(equipment)
          .where(eq(equipment.status, 'available'));
      } catch (error) {
        console.error('Error fetching available equipment:', error);
      }

      // Get pending approvals (timesheets pending approval)
      let pendingApprovalsResult = { count: 0 };
      try {
        [pendingApprovalsResult] = await db
          .select({ count: count() })
          .from(timesheets)
          .where(eq(timesheets.status, 'pending'));
      } catch (error) {
        console.error('Error fetching pending approvals:', error);
      }

      // Calculate monthly revenue (placeholder - you can implement actual calculation)
      const monthlyRevenue = 0;

      // Calculate equipment utilization (placeholder)
      const equipmentUtilization = 0;

      // Get employees currently on leave
      let employeesCurrentlyOnLeave: any[] = [];
      try {
        employeesCurrentlyOnLeave = await this.getEmployeesCurrentlyOnLeave();
      } catch (error) {
        console.error('Error fetching employees on leave, using default:', error);
        employeesCurrentlyOnLeave = [];
      }

      return {
        totalEmployees: totalEmployeesResult.count,
        activeProjects: activeProjectsResult.count,
        availableEquipment: availableEquipmentResult.count,
        monthlyRevenue,
        pendingApprovals: pendingApprovalsResult.count,
        activeRentals: activeRentalsResult.count,
        totalCustomers: totalCustomersResult.count,
        equipmentUtilization,
        todayTimesheets: todayTimesheetsResult.count,
        expiredDocuments: expiredDocumentsResult.count,
        expiringDocuments: expiringDocumentsResult.count,
        employeesOnLeave: employeesCurrentlyOnLeave.length,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw error;
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
            daysRemaining = Math.abs(diffDays);
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
      console.error('Error fetching iqama data:', error);
      throw error;
    }
  }

  static async getTodayTimesheets(limit: number = 50): Promise<TimesheetData[]> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      const timesheetData = await db
        .select({
          id: timesheets.id,
          employeeName: sql<string>`CONCAT(${employees.firstName}, ' ', ${employees.lastName})`,
          fileNumber: employees.fileNumber,
          department: departments.name,
          checkIn: timesheets.startTime,
          checkOut: timesheets.endTime,
          totalHours: sql<number>`CAST(${timesheets.hoursWorked} AS DECIMAL)`,
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
        };
      });
    } catch (error) {
      console.error('Error fetching timesheet data:', error);
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
            daysRemaining = Math.abs(diffDays);
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
      console.error('Error fetching document data:', error);
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
      console.error('Error fetching leave data:', error);
      throw error;
    }
  }

  static async getEmployeesCurrentlyOnLeave(): Promise<LeaveRequest[]> {
    try {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
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
      console.error('Error fetching employees currently on leave:', error);
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
      console.error('Error fetching rental data:', error);
      // Return empty array instead of throwing to prevent dashboard from failing
      return [];
    }
  }

  static async getActiveProjects(limit: number = 50): Promise<ActiveProject[]> {
    try {
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
        .where(eq(projects.status, 'active'))
        .limit(limit);

      return projectData.map(project => {
        // Calculate progress based on dates (placeholder calculation)
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

        // Set spent as 0 for now (placeholder)
        const spent = 0;

        return {
          ...project,
          progress,
          spent,
        };
      });
    } catch (error) {
      console.error('Error fetching project data:', error);
      // Return empty array instead of throwing to prevent dashboard from failing
      return [];
    }
  }

  static async getRecentActivity(limit: number = 50): Promise<RecentActivity[]> {
    try {
      const allActivities: any[] = [];

      // Get recent timesheet submissions
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
        .limit(Math.ceil(limit * 0.3));

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

      return sortedActivities;
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      // Return empty array instead of throwing to prevent dashboard from failing
      return [];
    }
  }
}
