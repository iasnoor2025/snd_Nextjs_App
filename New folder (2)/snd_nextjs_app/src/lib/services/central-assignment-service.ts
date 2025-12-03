import { db } from '@/lib/db';
import { 
  equipmentRentalHistory, 
  projectEquipment, 
  rentalItems, 
  employeeAssignments,
  equipment,
  employees 
} from '@/lib/drizzle/schema';
import { eq, and, or, ne } from 'drizzle-orm';
import { toDateString, toISOString, getPreviousDay, getCurrentDateString, getCurrentTimestamp } from '@/lib/utils/date-utils';

export interface AssignmentData {
  type: 'equipment' | 'employee';
  entityId: number; // equipmentId or employeeId
  assignmentType: 'rental' | 'project' | 'manual';
  startDate: string;
  endDate?: string;
  status?: 'active' | 'completed' | 'pending';
  notes?: string;
  name?: string; // Assignment name (for employee assignments)
  location?: string; // Assignment location
  // Context-specific fields
  rentalId?: number;
  projectId?: number;
  operatorId?: number;
  unitPrice?: number;
  totalPrice?: number;
  hourlyRate?: number;
  equipmentName?: string;
}

export class CentralAssignmentService {
  /**
   * Create a new assignment and automatically complete previous active assignments
   */
  static async createAssignment(data: AssignmentData) {
    const { type, entityId, startDate } = data;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Creating ${type} assignment for entity ${entityId}`);
    }
    
    // Complete previous active assignments for the same entity
    await this.completePreviousAssignments(type, entityId, startDate);
    
    // Create new assignment based on type
    if (type === 'equipment') {
      return await this.createEquipmentAssignment(data);
    } else {
      return await this.createEmployeeAssignment(data);
    }
  }

  /**
   * Complete all previous active assignments for an entity
   * This is the core unified completion logic
   */
  static async completePreviousAssignments(
    type: 'equipment' | 'employee', 
    entityId: number, 
    startDate: string
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Completing previous assignments for ${type} ${entityId}`);
    }
    
    const completedDateStr = getPreviousDay(startDate);
    const completedTimestamp = toISOString(completedDateStr);
    const updatedAt = getCurrentTimestamp();
    const updatedAtDate = getCurrentDateString();

    if (type === 'equipment') {
      // Complete equipment assignments across all tables in parallel
      if (process.env.NODE_ENV === 'development') {
        console.log(`Completing equipment ${entityId} previous assignments`);
      }
      
      await Promise.all([
        // Complete equipment rental history
        db.update(equipmentRentalHistory)
          .set({
            endDate: completedTimestamp,
            status: 'completed',
            updatedAt,
          })
          .where(
            and(
              eq(equipmentRentalHistory.equipmentId, entityId),
              eq(equipmentRentalHistory.status, 'active')
            )
          ),
        
        // Complete project equipment
        db.update(projectEquipment)
          .set({
            endDate: completedDateStr,
            status: 'completed',
            updatedAt: updatedAtDate,
          })
          .where(
            and(
              eq(projectEquipment.equipmentId, entityId),
              eq(projectEquipment.status, 'active')
            )
          ),
        
        // Complete rental items
        db.update(rentalItems)
          .set({
            completedDate: completedDateStr,
            status: 'completed',
            updatedAt: updatedAtDate,
          })
          .where(
            and(
              eq(rentalItems.equipmentId, entityId),
              eq(rentalItems.status, 'active')
            )
          )
      ]);
    } else {
      // Complete employee assignments
      if (process.env.NODE_ENV === 'development') {
        console.log(`Completing employee ${entityId} previous assignments`);
      }
      
      await db.update(employeeAssignments)
        .set({
          endDate: completedDateStr,
          status: 'completed',
          updatedAt: updatedAtDate,
        })
        .where(
          and(
            eq(employeeAssignments.employeeId, entityId),
            eq(employeeAssignments.status, 'active')
          )
        );
    }
  }

  /**
   * Create equipment assignment in appropriate table
   */
  static async createEquipmentAssignment(data: AssignmentData) {
    const { entityId, assignmentType, startDate, endDate, status = 'active', notes } = data;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Creating equipment assignment for equipment ${entityId}, type: ${assignmentType}`);
    }

    const now = getCurrentTimestamp();
    const startDateISO = toISOString(startDate);
    const endDateISO = endDate ? toISOString(endDate) : null;

    if (assignmentType === 'rental') {
      // Create in equipment_rental_history
      const [result] = await db.insert(equipmentRentalHistory).values({
        equipmentId: entityId,
        rentalId: data.rentalId,
        projectId: data.projectId,
        assignmentType: 'rental',
        startDate: startDateISO,
        endDate: endDateISO,
        status,
        notes: notes || '',
        dailyRate: data.unitPrice?.toString(),
        totalAmount: data.totalPrice?.toString(),
        createdAt: now,
        updatedAt: now,
      }).returning();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Created equipment rental history assignment ${result.id}`);
      }
      return result;
    } else if (assignmentType === 'project') {
      // Create in project_equipment
      const [result] = await db.insert(projectEquipment).values({
        projectId: data.projectId!,
        equipmentId: entityId,
        operatorId: data.operatorId,
        startDate: toDateString(startDate),
        endDate: endDate ? toDateString(endDate) : null,
        hourlyRate: data.hourlyRate!,
        status,
        notes: notes || '',
        assignedBy: data.operatorId,
        updatedAt: new Date(),
      }).returning();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Created project equipment assignment ${result.id}`);
      }
      return result;
    } else {
      // Create in equipment_rental_history for manual assignments
      const [result] = await db.insert(equipmentRentalHistory).values({
        equipmentId: entityId,
        employeeId: data.operatorId,
        assignmentType: 'manual',
        startDate: startDateISO,
        endDate: endDateISO,
        status,
        notes: notes || '',
        dailyRate: data.unitPrice?.toString(),
        totalAmount: data.totalPrice?.toString(),
        createdAt: now,
        updatedAt: now,
      }).returning();
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Created manual equipment assignment ${result.id}`);
      }
      return result;
    }
  }

  /**
   * Create employee assignment
   */
  static async createEmployeeAssignment(data: AssignmentData) {
    const { entityId, assignmentType, startDate, endDate, status = 'active', notes, name, location } = data;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Creating employee assignment for employee ${entityId}, type: ${assignmentType}`);
    }

    // Determine name based on assignment type and context
    let assignmentName = `Assignment - ${assignmentType}`;
    let assignmentLocation = '';

    if (name) {
      // Use provided name
      assignmentName = name;
      assignmentLocation = location || '';
    } else if (assignmentType === 'rental') {
      assignmentName = `Rental Operator - ${data.equipmentName || 'Equipment'}`;
      assignmentLocation = 'Rental Site';
    } else if (assignmentType === 'project') {
      assignmentName = `Project Assignment - ${data.equipmentName || 'Project'}`;
      assignmentLocation = 'Project Site';
    } else {
      assignmentName = notes || `Manual Assignment - ${assignmentType}`;
      assignmentLocation = '';
    }

    const now = getCurrentDateString();
    const [result] = await db.insert(employeeAssignments).values({
      employeeId: entityId,
      projectId: data.projectId,
      rentalId: data.rentalId,
      name: assignmentName,
      type: assignmentType,
      location: assignmentLocation,
      startDate,
      endDate: endDate || null,
      status,
      notes: notes || '',
      createdAt: now,
      updatedAt: now,
    }).returning();

    if (process.env.NODE_ENV === 'development') {
      console.log(`Created employee assignment ${result.id}`);
    }
    return result;
  }

  /**
   * Get all assignments for an entity (equipment or employee)
   */
  static async getEntityAssignments(type: 'equipment' | 'employee', entityId: number) {
    if (type === 'equipment') {
      // Get assignments from all equipment tables
      const [rentalHistory, projectAssignments, rentalItemsData] = await Promise.all([
        db.select().from(equipmentRentalHistory).where(eq(equipmentRentalHistory.equipmentId, entityId)),
        db.select().from(projectEquipment).where(eq(projectEquipment.equipmentId, entityId)),
        db.select().from(rentalItems).where(eq(rentalItems.equipmentId, entityId))
      ]);

      return {
        rentalHistory,
        projectAssignments,
        rentalItems: rentalItemsData,
        allAssignments: [...rentalHistory, ...projectAssignments, ...rentalItemsData]
      };
    } else {
      // Get employee assignments
      const assignments = await db.select().from(employeeAssignments).where(eq(employeeAssignments.employeeId, entityId));
      return { assignments };
    }
  }

  /**
   * Complete a specific assignment
   * Optimized to only update the relevant table instead of trying all tables
   */
  static async completeAssignment(
    type: 'equipment' | 'employee',
    assignmentId: number,
    endDate?: string
  ) {
    const completionDate = toDateString(endDate);
    const updatedAt = getCurrentTimestamp();
    const updatedAtDate = getCurrentDateString();

    if (type === 'equipment') {
      // Determine which table this assignment belongs to by checking both in parallel
      const [rentalAssignment, projectAssignment] = await Promise.all([
        db.select({ 
          equipmentId: equipmentRentalHistory.equipmentId,
          rentalId: equipmentRentalHistory.rentalId
        })
          .from(equipmentRentalHistory)
          .where(eq(equipmentRentalHistory.id, assignmentId))
          .limit(1),
        db.select({ 
          equipmentId: projectEquipment.equipmentId
        })
          .from(projectEquipment)
          .where(eq(projectEquipment.id, assignmentId))
          .limit(1)
      ]);

      const equipmentId = rentalAssignment[0]?.equipmentId || projectAssignment[0]?.equipmentId;
      const rentalId = rentalAssignment[0]?.rentalId;

      // Update only the relevant table
      if (rentalAssignment[0]) {
        // Update equipment rental history
        await db.update(equipmentRentalHistory)
          .set({ 
            status: 'completed', 
            endDate: toISOString(completionDate), 
            updatedAt 
          })
          .where(eq(equipmentRentalHistory.id, assignmentId));
      } else if (projectAssignment[0]) {
        // Update project equipment
        await db.update(projectEquipment)
          .set({ 
            status: 'completed', 
            endDate: completionDate, 
            updatedAt: updatedAtDate 
          })
          .where(eq(projectEquipment.id, assignmentId));
      }

      // For rental items, update by rentalId and equipmentId (not by assignmentId)
      if (rentalId && equipmentId) {
        await db
          .update(rentalItems)
          .set({ 
            status: 'completed', 
            completedDate: completionDate, 
            updatedAt: updatedAtDate 
          })
          .where(
            and(
              eq(rentalItems.rentalId, rentalId),
              eq(rentalItems.equipmentId, equipmentId)
            )
          );
      }

      // Update equipment status after completing assignment
      if (equipmentId) {
        const { EquipmentStatusService } = await import('@/lib/services/equipment-status-service');
        await EquipmentStatusService.updateEquipmentStatusImmediately(equipmentId);
      }
    } else {
      await db.update(employeeAssignments)
        .set({ 
          status: 'completed', 
          endDate: completionDate, 
          updatedAt: updatedAtDate 
        })
        .where(eq(employeeAssignments.id, assignmentId));
    }
  }

  /**
   * Complete all assignments for an employee going on vacation
   * Sets end date to one day before vacation starts
   */
  static async completeAssignmentsForVacation(
    employeeId: number,
    vacationStartDate: string
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Completing assignments for employee ${employeeId} vacation starting ${vacationStartDate}`);
    }
    
    // Set end date to one day before vacation starts
    const assignmentEndStr = getPreviousDay(vacationStartDate);
    const updatedAt = getCurrentDateString();

    await db
      .update(employeeAssignments)
      .set({
        status: 'completed',
        endDate: assignmentEndStr,
        updatedAt,
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          ne(employeeAssignments.status, 'completed')
        )
      );

    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Completed assignments for employee ${employeeId} ending ${assignmentEndStr}`);
    }
  }

  /**
   * Complete all assignments for an employee exit
   * Sets end date to last working date
   */
  static async completeAssignmentsForExit(
    employeeId: number,
    lastWorkingDate: string
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Completing assignments for employee ${employeeId} exit on ${lastWorkingDate}`);
    }
    
    const updatedAt = getCurrentDateString();

    await db
      .update(employeeAssignments)
      .set({
        status: 'completed',
        endDate: lastWorkingDate,
        updatedAt,
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          ne(employeeAssignments.status, 'completed')
        )
      );

    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Completed assignments for employee ${employeeId}`);
    }
  }

  /**
   * Restore assignments after vacation settlement deletion
   */
  static async restoreAssignmentsAfterVacationDeletion(
    employeeId: number,
    vacationStartDate: string
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Restoring assignments for employee ${employeeId} after vacation deletion`);
    }
    
    const assignmentEndDateStr = getPreviousDay(vacationStartDate);
    const updatedAt = getCurrentDateString();

    await db
      .update(employeeAssignments)
      .set({
        status: 'active',
        endDate: null,
        updatedAt,
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'completed'),
          eq(employeeAssignments.endDate, assignmentEndDateStr)
        )
      );

    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Restored assignments for employee ${employeeId}`);
    }
  }

  /**
   * Restore assignments after exit settlement deletion
   */
  static async restoreAssignmentsAfterExitDeletion(
    employeeId: number,
    lastWorkingDate: string
  ): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Restoring assignments for employee ${employeeId} after exit deletion`);
    }
    
    const updatedAt = getCurrentDateString();

    await db
      .update(employeeAssignments)
      .set({
        status: 'active',
        endDate: null,
        updatedAt,
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'completed'),
          eq(employeeAssignments.endDate, lastWorkingDate)
        )
      );

    if (process.env.NODE_ENV === 'development') {
      console.log(`CentralAssignmentService: Restored assignments for employee ${employeeId}`);
    }
  }
}

