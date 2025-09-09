import { db } from '@/lib/drizzle';
import { equipment, equipmentMaintenance, equipmentRentalHistory } from '@/lib/drizzle/schema';
import { eq, and, sql } from 'drizzle-orm';

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

      // Check for active maintenance records
      const activeMaintenance = await db
        .select({ id: equipmentMaintenance.id })
        .from(equipmentMaintenance)
        .where(
          and(
            eq(equipmentMaintenance.equipmentId, equipmentId),
            sql`${equipmentMaintenance.status} IN ('open', 'in_progress')`
          )
        )
        .limit(1);

      // Check for active rental/assignment records
      const activeAssignments = await db
        .select({ id: equipmentRentalHistory.id })
        .from(equipmentRentalHistory)
        .where(
          and(
            eq(equipmentRentalHistory.equipmentId, equipmentId),
            eq(equipmentRentalHistory.status, 'active')
          )
        )
        .limit(1);

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
        await db
          .update(equipment)
          .set({
            status: newStatus,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(equipment.id, equipmentId));

        console.log(`🔄 Equipment Status Updated: ${equipmentName} (${equipmentId})`);
        console.log(`   Previous: ${currentStatus} → New: ${newStatus}`);
        console.log(`   Reason: ${reason}`);

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
    console.log(`📋 Assignment created for equipment ${equipmentId}, updating status immediately...`);
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when assignment is updated
   */
  static async onAssignmentUpdated(equipmentId: number): Promise<void> {
    console.log(`📝 Assignment updated for equipment ${equipmentId}, updating status immediately...`);
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when assignment is deleted/cancelled
   */
  static async onAssignmentDeleted(equipmentId: number): Promise<void> {
    console.log(`🗑️ Assignment deleted for equipment ${equipmentId}, updating status immediately...`);
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when maintenance is created
   */
  static async onMaintenanceCreated(equipmentId: number): Promise<void> {
    console.log(`🔧 Maintenance created for equipment ${equipmentId}, updating status immediately...`);
    await this.updateEquipmentStatusImmediately(equipmentId);
  }

  /**
   * Update equipment status when maintenance is completed/cancelled
   */
  static async onMaintenanceCompleted(equipmentId: number): Promise<void> {
    console.log(`✅ Maintenance completed for equipment ${equipmentId}, updating status immediately...`);
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
      console.log('🔄 Starting bulk equipment status update...');
      
      const allEquipment = await db
        .select({ id: equipment.id, name: equipment.name, status: equipment.status })
        .from(equipment);

      let updated = 0;
      let errors = 0;

      for (const equip of allEquipment) {
        try {
          const result = await this.updateEquipmentStatusImmediately(equip.id);
          if (result.success && result.previousStatus !== result.newStatus) {
            updated++;
          }
        } catch (error) {
          console.error(`❌ Error updating equipment ${equip.name} (${equip.id}):`, error);
          errors++;
        }
      }

      console.log(`🎉 Bulk equipment status update completed. Total: ${allEquipment.length}, Updated: ${updated}, Errors: ${errors}`);
      
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
