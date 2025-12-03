import { db } from '@/lib/drizzle';
import { equipment, equipmentMaintenance, equipmentRentalHistory, rentalItems, rentals } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';

export interface EquipmentStatusIssue {
  equipmentId: number;
  equipmentName: string;
  erpnextId: string;
  currentStatus: string;
  issue: string;
  action: string;
}

export class EquipmentStatusMonitor {
  /**
   * Check for equipment with incorrect status and fix them
   */
  static async checkAndFixEquipmentStatus(): Promise<{
    checked: number;
    fixed: number;
    issues: EquipmentStatusIssue[];
  }> {
    const issues: EquipmentStatusIssue[] = [];
    let fixedCount = 0;
    let totalChecked = 0;

    try {
      // 1. Check equipment with 'under_maintenance' status that have no maintenance records
      const underMaintenanceWithoutRecords = await db
        .select({
          id: equipment.id,
          name: equipment.name,
          erpnextId: equipment.erpnextId,
          status: equipment.status,
        })
        .from(equipment)
        .where(
          sql`${equipment.status} = 'under_maintenance' AND NOT EXISTS (
            SELECT 1 FROM ${equipmentMaintenance} 
            WHERE ${equipmentMaintenance.equipmentId} = ${equipment.id}
          )`
        );

      totalChecked += underMaintenanceWithoutRecords.length;

      for (const equip of underMaintenanceWithoutRecords) {
        issues.push({
          equipmentId: equip.id,
          equipmentName: equip.name,
          erpnextId: equip.erpnextId || 'N/A',
          currentStatus: equip.status,
          issue: 'Status is under_maintenance but no maintenance records exist',
          action: 'Set status to available'
        });

        // Fix the status
        await db
          .update(equipment)
          .set({ 
            status: 'available',
            updatedAt: new Date().toISOString()
          })
          .where(eq(equipment.id, equip.id));

        fixedCount++;
              }

      // 2. Check equipment with 'assigned' status that have no active assignments
      const assignedWithoutActiveAssignments = await db
        .select({
          id: equipment.id,
          name: equipment.name,
          erpnextId: equipment.erpnextId,
          status: equipment.status,
        })
        .from(equipment)
        .where(
          sql`${equipment.status} = 'assigned' AND NOT EXISTS (
            SELECT 1 FROM ${equipmentRentalHistory} 
            WHERE ${equipmentRentalHistory.equipmentId} = ${equipment.id} AND ${equipmentRentalHistory.status} = 'active'
          )`
        );

      totalChecked += assignedWithoutActiveAssignments.length;

      for (const equip of assignedWithoutActiveAssignments) {
        issues.push({
          equipmentId: equip.id,
          equipmentName: equip.name,
          erpnextId: equip.erpnextId || 'N/A',
          currentStatus: equip.status,
          issue: 'Status is assigned but no active rental/assignment records exist',
          action: 'Set status to available'
        });

        // Fix the status
        await db
          .update(equipment)
          .set({ 
            status: 'available',
            updatedAt: new Date().toISOString()
          })
          .where(eq(equipment.id, equip.id));

        fixedCount++;
              }

      // 3. Check equipment with 'available' status that should be 'under_maintenance'
      const availableWithActiveMaintenance = await db
        .select({
          id: equipment.id,
          name: equipment.name,
          erpnextId: equipment.erpnextId,
          status: equipment.status,
        })
        .from(equipment)
        .where(
          sql`${equipment.status} = 'available' AND EXISTS (
            SELECT 1 FROM ${equipmentMaintenance} 
            WHERE ${equipmentMaintenance.equipmentId} = ${equipment.id} 
            AND ${equipmentMaintenance.status} IN ('open', 'in_progress')
          )`
        );

      totalChecked += availableWithActiveMaintenance.length;

      for (const equip of availableWithActiveMaintenance) {
        issues.push({
          equipmentId: equip.id,
          equipmentName: equip.name,
          erpnextId: equip.erpnextId || 'N/A',
          currentStatus: equip.status,
          issue: 'Status is available but has active maintenance records',
          action: 'Set status to under_maintenance'
        });

        // Fix the status
        await db
          .update(equipment)
          .set({ 
            status: 'under_maintenance',
            updatedAt: new Date().toISOString()
          })
          .where(eq(equipment.id, equip.id));

        fixedCount++;
              }

      // 4. Check equipment with 'available' status that should be 'assigned'
      const availableWithActiveAssignments = await db
        .select({
          id: equipment.id,
          name: equipment.name,
          erpnextId: equipment.erpnextId,
          status: equipment.status,
        })
        .from(equipment)
        .where(
          sql`${equipment.status} = 'available' AND EXISTS (
            SELECT 1 FROM ${equipmentRentalHistory} 
            WHERE ${equipmentRentalHistory.equipmentId} = ${equipment.id} AND ${equipmentRentalHistory.status} = 'active'
          )`
        );

      totalChecked += availableWithActiveAssignments.length;

      for (const equip of availableWithActiveAssignments) {
        issues.push({
          equipmentId: equip.id,
          equipmentName: equip.name,
          erpnextId: equip.erpnextId || 'N/A',
          currentStatus: equip.status,
          issue: 'Status is available but has active rental/assignment records',
          action: 'Set status to assigned'
        });

        // Fix the status
        await db
          .update(equipment)
          .set({ 
            status: 'assigned',
            updatedAt: new Date().toISOString()
          })
          .where(eq(equipment.id, equip.id));

        fixedCount++;
              }

      // 5. Backfill completedDate for rental items that are completed but missing completedDate
      const completedItemsWithoutDate = await db
        .select({
          id: rentalItems.id,
          rentalId: rentalItems.rentalId,
          equipmentId: rentalItems.equipmentId,
        })
        .from(rentalItems)
        .where(
          sql`${rentalItems.status} = 'completed' AND ${rentalItems.completedDate} IS NULL`
        );

      let backfilledCount = 0;
      for (const item of completedItemsWithoutDate) {
        try {
          // Try to get completion date from rental's actualEndDate
          const rental = await db
            .select({ actualEndDate: rentals.actualEndDate })
            .from(rentals)
            .where(eq(rentals.id, item.rentalId))
            .limit(1);

          // Try to get completion date from equipment assignment endDate
          const assignment = await db
            .select({ endDate: equipmentRentalHistory.endDate })
            .from(equipmentRentalHistory)
            .where(
              sql`${equipmentRentalHistory.rentalId} = ${item.rentalId} 
                  AND ${equipmentRentalHistory.equipmentId} = ${item.equipmentId} 
                  AND ${equipmentRentalHistory.status} = 'completed'`
            )
            .limit(1);

          // Use rental's actualEndDate, assignment's endDate, or current date
          const completedDate = 
            rental[0]?.actualEndDate || 
            (assignment[0]?.endDate ? assignment[0].endDate.split('T')[0] : null) || 
            new Date().toISOString().split('T')[0];

          await db
            .update(rentalItems)
            .set({
              completedDate: completedDate,
              updatedAt: completedDate,
            })
            .where(eq(rentalItems.id, item.id));

          backfilledCount++;
        } catch (error) {
          console.error(`Error backfilling completedDate for rental item ${item.id}:`, error);
        }
      }

      if (backfilledCount > 0) {
        // After backfilling, re-check equipment statuses that might have been affected
        const affectedEquipmentIds = new Set(
          completedItemsWithoutDate.map(item => item.equipmentId).filter(id => id !== null)
        );
        
        for (const equipmentId of affectedEquipmentIds) {
          if (equipmentId) {
            try {
              await EquipmentStatusService.updateEquipmentStatusImmediately(equipmentId);
            } catch (error) {
              console.error(`Error updating equipment ${equipmentId} status after backfill:`, error);
            }
          }
        }
      }
      return {
        checked: totalChecked,
        fixed: fixedCount,
        issues
      };

    } catch (error) {
      console.error('❌ Error during equipment status monitoring:', error);
      throw error;
    }
  }

  /**
   * Get a summary of current equipment status distribution
   */
  static async getEquipmentStatusSummary() {
    try {
      const statusSummary = await db
        .select({
          status: equipment.status,
          count: sql<number>`count(*)`
        })
        .from(equipment)
        .groupBy(equipment.status);

      return statusSummary;
    } catch (error) {
      console.error('❌ Error getting equipment status summary:', error);
      throw error;
    }
  }

  /**
   * Get equipment with potential status issues
   */
  static async getEquipmentWithIssues(): Promise<EquipmentStatusIssue[]> {
    try {
      const issues: EquipmentStatusIssue[] = [];

      // Check for equipment with 'under_maintenance' status that have no maintenance records
      const underMaintenanceWithoutRecords = await db
        .select({
          id: equipment.id,
          name: equipment.name,
          erpnextId: equipment.erpnextId,
          status: equipment.status,
        })
        .from(equipment)
        .where(
          sql`${equipment.status} = 'under_maintenance' AND NOT EXISTS (
            SELECT 1 FROM ${equipmentMaintenance} 
            WHERE ${equipmentMaintenance.equipmentId} = ${equipment.id}
          )`
        );

      for (const equip of underMaintenanceWithoutRecords) {
        issues.push({
          equipmentId: equip.id,
          equipmentName: equip.name,
          erpnextId: equip.erpnextId || 'N/A',
          currentStatus: equip.status,
          issue: 'Status is under_maintenance but no maintenance records exist',
          action: 'Set status to available'
        });
      }

      // Check for equipment with 'assigned' status that have no active assignments
      const assignedWithoutActiveAssignments = await db
        .select({
          id: equipment.id,
          name: equipment.name,
          erpnextId: equipment.erpnextId,
          status: equipment.status,
        })
        .from(equipment)
        .where(
          sql`${equipment.status} = 'assigned' AND NOT EXISTS (
            SELECT 1 FROM ${equipmentRentalHistory} 
            WHERE ${equipmentRentalHistory.equipmentId} = ${equipment.id} AND ${equipmentRentalHistory.status} = 'active'
          )`
        );

      for (const equip of assignedWithoutActiveAssignments) {
        issues.push({
          equipmentId: equip.id,
          equipmentName: equip.name,
          erpnextId: equip.erpnextId || 'N/A',
          currentStatus: equip.status,
          issue: 'Status is assigned but no active rental/assignment records exist',
          action: 'Set status to available'
        });
      }

      return issues;
    } catch (error) {
      console.error('❌ Error getting equipment with issues:', error);
      throw error;
    }
  }
}
