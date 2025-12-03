import { db } from '@/lib/drizzle';
import { equipment, equipmentMaintenance, equipmentRentalHistory, rentalItems, projectEquipment } from '@/lib/drizzle/schema';
import { eq, and, sql, or } from 'drizzle-orm';
import { cacheService } from '@/lib/redis';
import { CACHE_TAGS } from '@/lib/redis';
import { getCurrentTimestamp } from '@/lib/utils/date-utils';

export class EquipmentStatusService {
  /**
   * Immediately update equipment status based on current assignments and maintenance
   * This is called in real-time when equipment is assigned/unassigned
   */
  static async updateEquipmentStatusImmediately(equipmentId: number): Promise<{
    success: boolean;
    previousStatus: string;
    newStatus: string;
    reason: string;
  }> {
    try {
      // Get current equipment status
      const currentEquipment = await db
        .select({ id: equipment.id, status: equipment.status, name: equipment.name })
        .from(equipment)
        .where(eq(equipment.id, equipmentId))
        .limit(1);

      if (currentEquipment.length === 0) {
        throw new Error('Equipment not found');
      }

      const currentStatus = currentEquipment[0]?.status;
      const equipmentName = currentEquipment[0]?.name;
      
      if (!currentStatus || !equipmentName) {
        throw new Error('Equipment data is incomplete');
      }

      // Optimized: Check for active maintenance and assignments in parallel
      // Using a single combined query approach for better performance
      const [activeMaintenance, activeRentalAssignments, activeProjectAssignments] = await Promise.all([
        // Check for active maintenance records
        db
          .select({ id: equipmentMaintenance.id })
          .from(equipmentMaintenance)
          .where(
            and(
              eq(equipmentMaintenance.equipmentId, equipmentId),
              sql`${equipmentMaintenance.status} IN ('open', 'in_progress')`
            )
          )
          .limit(1),
        // Check for active rental/assignment records
        // An assignment is active if:
        // 1. equipmentRentalHistory.status = 'active' AND
        // 2. For rental assignments, the rental item must also be active (not completed)
        db
          .select({ 
            id: equipmentRentalHistory.id,
            assignmentType: equipmentRentalHistory.assignmentType,
            rentalId: equipmentRentalHistory.rentalId,
          })
          .from(equipmentRentalHistory)
          .leftJoin(
            rentalItems,
            and(
              eq(rentalItems.rentalId, equipmentRentalHistory.rentalId),
              eq(rentalItems.equipmentId, equipmentRentalHistory.equipmentId)
            )
          )
          .where(
            and(
              eq(equipmentRentalHistory.equipmentId, equipmentId),
              eq(equipmentRentalHistory.status, 'active'),
              // For rental assignments, also check that rental item is not completed
              or(
                // Not a rental assignment - use assignment status
                sql`${equipmentRentalHistory.assignmentType} != 'rental'`,
                // Is a rental assignment but rental item doesn't exist (legacy data) - treat as active if assignment is active
                sql`${rentalItems.id} IS NULL`,
                // Is a rental assignment and rental item exists - must be active (not completed)
                and(
                  sql`${rentalItems.id} IS NOT NULL`,
                  sql`${rentalItems.status} = 'active'`,
                  sql`${rentalItems.completedDate} IS NULL`
                )
              )
            )
          )
          .limit(1),
        // Check for active project equipment assignments
        // An assignment is active if:
        // 1. status is 'active' or 'pending' AND
        // 2. startDate is today or in the past AND
        // 3. endDate is null or in the future
        db
          .select({ 
            id: projectEquipment.id,
          })
          .from(projectEquipment)
          .where(
            and(
              eq(projectEquipment.equipmentId, equipmentId),
              sql`${projectEquipment.status} IN ('active', 'pending')`,
              sql`${projectEquipment.startDate} <= CURRENT_DATE`,
              or(
                sql`${projectEquipment.endDate} IS NULL`,
                sql`${projectEquipment.endDate} >= CURRENT_DATE`
              )
            )
          )
          .limit(1)
      ]);

      // Combine both types of assignments
      const activeAssignments = [...activeRentalAssignments, ...activeProjectAssignments];

      // Determine what the status should be
      let newStatus = 'available';
      let reason = 'No active assignments or maintenance';

      if (activeMaintenance.length > 0) {
        newStatus = 'under_maintenance';
        reason = 'Has active maintenance records';
      } else if (activeAssignments.length > 0) {
        newStatus = 'assigned';
        reason = 'Has active rental/assignment records';
      }

      // Only update if status actually needs to change
      if (currentStatus !== newStatus) {
        const updatedAt = getCurrentTimestamp();
        
        await db
          .update(equipment)
          .set({
            status: newStatus,
            updatedAt,
          })
          .where(eq(equipment.id, equipmentId));

        if (process.env.NODE_ENV === 'development') {
                  }

        // Invalidate equipment cache to reflect status changes in list view
        // Use targeted invalidation if possible, otherwise fall back to tag-based
        try {
          await cacheService.invalidateCacheByTag(CACHE_TAGS.EQUIPMENT);
          if (process.env.NODE_ENV === 'development') {
          }
        } catch (cacheError) {
          // Don't fail the status update if cache invalidation fails
          if (process.env.NODE_ENV === 'development') {
            console.error('Error invalidating equipment cache:', cacheError);
          }
        }

        return {
          success: true,
          previousStatus: currentStatus,
          newStatus,
          reason,
        };
      } else {
        // Status is already correct
        return {
          success: true,
          previousStatus: currentStatus,
          newStatus: currentStatus,
          reason: 'Status already correct',
        };
      }
    } catch (error) {
      console.error('❌ Error updating equipment status immediately:', error);
      return {
        success: false,
        previousStatus: '',
        newStatus: '',
        reason: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Update equipment status when assignment is created
   */
  static async onAssignmentCreated(equipmentId: number): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when assignment is updated
   */
  static async onAssignmentUpdated(equipmentId: number): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when assignment is deleted/cancelled
   */
  static async onAssignmentDeleted(equipmentId: number): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when maintenance is created
   */
  static async onMaintenanceCreated(equipmentId: number): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when maintenance is completed/cancelled
   */
  static async onMaintenanceCompleted(equipmentId: number): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
    }
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Bulk update all equipment statuses (for initial sync or manual trigger)
   */
  static async updateAllEquipmentStatuses(): Promise<{
    total: number;
    updated: number;
    errors: number;
  }> {
    try {
      if (process.env.NODE_ENV === 'development') {
      }
      
      const allEquipment = await db
        .select({ id: equipment.id, name: equipment.name, status: equipment.status })
        .from(equipment);

      let updated = 0;
      let errors = 0;

      // Process in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < allEquipment.length; i += batchSize) {
        const batch = allEquipment.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (equip) => {
            try {
              const result = await this.updateEquipmentStatusImmediately(equip.id);
              if (result.success && result.previousStatus !== result.newStatus) {
                updated++;
              }
            } catch (error) {
              if (process.env.NODE_ENV === 'development') {
                console.error(`❌ Error updating equipment ${equip.name} (${equip.id}):`, error);
              }
              errors++;
            }
          })
        );
      }

      if (process.env.NODE_ENV === 'development') {
      }
      
      return {
        total: allEquipment.length,
        updated,
        errors,
      };
    } catch (error) {
      console.error('❌ Error in bulk equipment status update:', error);
      throw error;
    }
  }
}
