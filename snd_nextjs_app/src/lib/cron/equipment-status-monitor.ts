import { db } from '@/lib/drizzle';
import { equipment, equipmentMaintenance, equipmentRentalHistory } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';

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
      console.log('🔍 Starting equipment status monitoring...');

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
        console.log(`✅ Fixed ${equip.name} (${equip.erpnextId}) status to 'available'`);
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
        console.log(`✅ Fixed ${equip.name} (${equip.erpnextId}) status to 'available'`);
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
        console.log(`✅ Fixed ${equip.name} (${equip.erpnextId}) status to 'under_maintenance'`);
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
        console.log(`✅ Fixed ${equip.name} (${equip.erpnextId}) status to 'assigned'`);
      }

      console.log(`🎉 Equipment status monitoring completed. Checked: ${totalChecked}, Fixed: ${fixedCount}`);

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
