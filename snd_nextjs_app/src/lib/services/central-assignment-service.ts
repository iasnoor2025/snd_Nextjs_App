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
    
    console.log(`CentralAssignmentService: Creating ${type} assignment for entity ${entityId}`);
    
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
    console.log(`CentralAssignmentService: Completing previous assignments for ${type} ${entityId}`);
    
    const previousDay = new Date(startDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const completedDateStr = previousDay.toISOString().split('T')[0];
    const completedTimestamp = previousDay.toISOString();

    if (type === 'equipment') {
      // Complete equipment assignments across all tables
      console.log(`Completing equipment ${entityId} previous assignments`);
      
      await Promise.all([
        // Complete equipment rental history
        db.update(equipmentRentalHistory)
          .set({
            endDate: completedTimestamp,
            status: 'completed',
            updatedAt: new Date().toISOString(),
          })
          .where(
            and(
              eq(equipmentRentalHistory.equipmentId, entityId),
              eq(equipmentRentalHistory.status, 'active')
            )
          ).then(() => console.log(`Completed equipment rental history for equipment ${entityId}`)),
        
        // Complete project equipment
        db.update(projectEquipment)
          .set({
            endDate: completedDateStr,
            status: 'completed',
            updatedAt: new Date().toISOString().split('T')[0],
          })
          .where(
            and(
              eq(projectEquipment.equipmentId, entityId),
              eq(projectEquipment.status, 'active')
            )
          ).then(() => console.log(`Completed project equipment for equipment ${entityId}`)),
        
        // Complete rental items
        db.update(rentalItems)
          .set({
            completedDate: completedDateStr,
            status: 'completed',
            updatedAt: new Date().toISOString().split('T')[0],
          })
          .where(
            and(
              eq(rentalItems.equipmentId, entityId),
              eq(rentalItems.status, 'active')
            )
          ).then(() => console.log(`Completed rental items for equipment ${entityId}`))
      ]);
    } else {
      // Complete employee assignments
      console.log(`Completing employee ${entityId} previous assignments`);
      
      await db.update(employeeAssignments)
        .set({
          endDate: completedDateStr,
          status: 'completed',
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(
          and(
            eq(employeeAssignments.employeeId, entityId),
            eq(employeeAssignments.status, 'active')
          )
        ).then(() => console.log(`Completed employee assignments for employee ${entityId}`));
    }
  }

  /**
   * Create equipment assignment in appropriate table
   */
  static async createEquipmentAssignment(data: AssignmentData) {
    const { entityId, assignmentType, startDate, endDate, status = 'active', notes } = data;
    console.log(`Creating equipment assignment for equipment ${entityId}, type: ${assignmentType}`);

    if (assignmentType === 'rental') {
      // Create in equipment_rental_history
      const [result] = await db.insert(equipmentRentalHistory).values({
        equipmentId: entityId,
        rentalId: data.rentalId,
        projectId: data.projectId,
        assignmentType: 'rental',
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        status,
        notes: notes || '',
        dailyRate: data.unitPrice?.toString(),
        totalAmount: data.totalPrice?.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      
      console.log(`Created equipment rental history assignment ${result.id}`);
      return result;
    } else if (assignmentType === 'project') {
      // Create in project_equipment
      const [result] = await db.insert(projectEquipment).values({
        projectId: data.projectId!,
        equipmentId: entityId,
        operatorId: data.operatorId,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        hourlyRate: data.hourlyRate!,
        status,
        notes: notes || '',
        assignedBy: data.operatorId,
        updatedAt: new Date(),
      }).returning();
      
      console.log(`Created project equipment assignment ${result.id}`);
      return result;
    } else {
      // Create in equipment_rental_history for manual assignments
      const [result] = await db.insert(equipmentRentalHistory).values({
        equipmentId: entityId,
        employeeId: data.operatorId,
        assignmentType: 'manual',
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : null,
        status,
        notes: notes || '',
        dailyRate: data.unitPrice?.toString(),
        totalAmount: data.totalPrice?.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }).returning();
      
      console.log(`Created manual equipment assignment ${result.id}`);
      return result;
    }
  }

  /**
   * Create employee assignment
   */
  static async createEmployeeAssignment(data: AssignmentData) {
    const { entityId, assignmentType, startDate, endDate, status = 'active', notes, name, location } = data;
    console.log(`Creating employee assignment for employee ${entityId}, type: ${assignmentType}`);

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
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }).returning();

    console.log(`Created employee assignment ${result.id}`);
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
   */
  static async completeAssignment(
    type: 'equipment' | 'employee',
    assignmentId: number,
    endDate?: string
  ) {
    const completionDate = endDate || new Date().toISOString().split('T')[0];

    if (type === 'equipment') {
      // Get equipment ID before completing
      const equipmentAssignment = await db
        .select({ equipmentId: equipmentRentalHistory.equipmentId })
        .from(equipmentRentalHistory)
        .where(eq(equipmentRentalHistory.id, assignmentId))
        .limit(1);

      const equipmentId = equipmentAssignment[0]?.equipmentId;

      // Try to complete in all possible tables
      await Promise.all([
        db.update(equipmentRentalHistory)
          .set({ status: 'completed', endDate: completionDate, updatedAt: new Date().toISOString() })
          .where(eq(equipmentRentalHistory.id, assignmentId)),
        
        db.update(projectEquipment)
          .set({ status: 'completed', endDate: completionDate, updatedAt: new Date().toISOString().split('T')[0] })
          .where(eq(projectEquipment.id, assignmentId)),
        
        db.update(rentalItems)
          .set({ status: 'completed', completedDate: completionDate, updatedAt: new Date().toISOString().split('T')[0] })
          .where(eq(rentalItems.id, assignmentId))
      ]);

      // Update equipment status after completing assignment
      if (equipmentId) {
        const { EquipmentStatusService } = await import('@/lib/services/equipment-status-service');
        await EquipmentStatusService.updateEquipmentStatusImmediately(equipmentId);
      }
    } else {
      await db.update(employeeAssignments)
        .set({ status: 'completed', endDate: completionDate, updatedAt: new Date().toISOString().split('T')[0] })
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
    console.log(`CentralAssignmentService: Completing assignments for employee ${employeeId} vacation starting ${vacationStartDate}`);
    
    // Set end date to one day before vacation starts
    const assignmentEnd = new Date(vacationStartDate);
    assignmentEnd.setDate(assignmentEnd.getDate() - 1);
    const assignmentEndStr = assignmentEnd.toISOString().split('T')[0];

    await db
      .update(employeeAssignments)
      .set({
        status: 'completed',
        endDate: assignmentEndStr,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          ne(employeeAssignments.status, 'completed')
        )
      );

    console.log(`CentralAssignmentService: Completed assignments for employee ${employeeId} ending ${assignmentEndStr}`);
  }

  /**
   * Complete all assignments for an employee exit
   * Sets end date to last working date
   */
  static async completeAssignmentsForExit(
    employeeId: number,
    lastWorkingDate: string
  ): Promise<void> {
    console.log(`CentralAssignmentService: Completing assignments for employee ${employeeId} exit on ${lastWorkingDate}`);
    
    await db
      .update(employeeAssignments)
      .set({
        status: 'completed',
        endDate: lastWorkingDate,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          ne(employeeAssignments.status, 'completed')
        )
      );

    console.log(`CentralAssignmentService: Completed assignments for employee ${employeeId}`);
  }

  /**
   * Restore assignments after vacation settlement deletion
   */
  static async restoreAssignmentsAfterVacationDeletion(
    employeeId: number,
    vacationStartDate: string
  ): Promise<void> {
    console.log(`CentralAssignmentService: Restoring assignments for employee ${employeeId} after vacation deletion`);
    
    const assignmentEndDate = new Date(vacationStartDate);
    assignmentEndDate.setDate(assignmentEndDate.getDate() - 1);
    const assignmentEndDateStr = assignmentEndDate.toISOString().split('T')[0];

    await db
      .update(employeeAssignments)
      .set({
        status: 'active',
        endDate: null,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'completed'),
          eq(employeeAssignments.endDate, assignmentEndDateStr)
        )
      );

    console.log(`CentralAssignmentService: Restored assignments for employee ${employeeId}`);
  }

  /**
   * Restore assignments after exit settlement deletion
   */
  static async restoreAssignmentsAfterExitDeletion(
    employeeId: number,
    lastWorkingDate: string
  ): Promise<void> {
    console.log(`CentralAssignmentService: Restoring assignments for employee ${employeeId} after exit deletion`);
    
    await db
      .update(employeeAssignments)
      .set({
        status: 'active',
        endDate: null,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(
        and(
          eq(employeeAssignments.employeeId, employeeId),
          eq(employeeAssignments.status, 'completed'),
          eq(employeeAssignments.endDate, lastWorkingDate)
        )
      );

    console.log(`CentralAssignmentService: Restored assignments for employee ${employeeId}`);
  }
}

