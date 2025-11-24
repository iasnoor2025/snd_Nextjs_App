import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { db } from '@/lib/db';
import { equipmentMaintenance, equipment, employees, equipmentMaintenanceItems } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { cacheService } from '@/lib/redis';
import { CACHE_TAGS } from '@/lib/redis';

export const GET = withPermission(PermissionConfigs.maintenance.read)(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const maintenanceId = parseInt(id);
      if (!maintenanceId) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

      const rows = await db
        .select({
          id: equipmentMaintenance.id,
          equipment_id: equipmentMaintenance.equipmentId,
          title: equipmentMaintenance.title,
          description: equipmentMaintenance.description,
          status: equipmentMaintenance.status,
          type: equipmentMaintenance.type,
          priority: equipmentMaintenance.priority,
          assigned_to_employee_id: equipmentMaintenance.assignedToEmployeeId,
          scheduled_date: equipmentMaintenance.scheduledDate,
          due_date: equipmentMaintenance.dueDate,
          cost: equipmentMaintenance.cost,
          created_at: equipmentMaintenance.createdAt,
          updated_at: equipmentMaintenance.updatedAt,
          equipment: {
            id: equipment.id,
            name: equipment.name,
            doorNumber: equipment.doorNumber,
          },
          mechanic: {
            id: employees.id,
            first_name: employees.firstName,
            last_name: employees.lastName,
          },
        })
        .from(equipmentMaintenance)
        .leftJoin(equipment, eq(equipment.id, equipmentMaintenance.equipmentId))
        .leftJoin(
          employees,
          eq(employees.id, equipmentMaintenance.assignedToEmployeeId)
        )
        .where(eq(equipmentMaintenance.id, maintenanceId));

      const base = rows[0];
      if (!base)
        return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

      const items = await db
        .select({
          id: equipmentMaintenanceItems.id,
          maintenance_id: equipmentMaintenanceItems.maintenanceId,
          name: equipmentMaintenanceItems.name,
          description: equipmentMaintenanceItems.description,
          quantity: equipmentMaintenanceItems.quantity,
          unit: equipmentMaintenanceItems.unit,
          unit_cost: equipmentMaintenanceItems.unitCost,
          total_cost: equipmentMaintenanceItems.totalCost,
          created_at: equipmentMaintenanceItems.createdAt,
          updated_at: equipmentMaintenanceItems.updatedAt,
        })
        .from(equipmentMaintenanceItems)
        .where(eq(equipmentMaintenanceItems.maintenanceId, maintenanceId));

      return NextResponse.json({ success: true, data: { ...base, items } });
    } catch (error) {
      console.error('Error fetching maintenance:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

export const PUT = withPermission(PermissionConfigs.maintenance.update)(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const maintenanceId = parseInt(id);
      if (!maintenanceId) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
      const body = await request.json();
      const {
        status,
        assigned_to_employee_id,
        type,
        title,
        description,
        scheduled_date,
        due_date,
        items,
      } = body;

      const nowIso = new Date().toISOString();
      const dataToUpdate: any = { updatedAt: nowIso };
      if (status !== undefined) dataToUpdate.status = status;
      if (assigned_to_employee_id !== undefined)
        dataToUpdate.assignedToEmployeeId = assigned_to_employee_id;
      if (type !== undefined) dataToUpdate.type = type;
      if (title !== undefined) dataToUpdate.title = title;
      if (description !== undefined) dataToUpdate.description = description;
      if (scheduled_date !== undefined)
        dataToUpdate.scheduledDate = scheduled_date ? new Date(scheduled_date).toISOString() : null;
      if (due_date !== undefined)
        dataToUpdate.dueDate = due_date ? new Date(due_date).toISOString() : null;

              const updated = await db.transaction(async tx => {
        const updatedMaint = await tx
          .update(equipmentMaintenance)
          .set(dataToUpdate)
          .where(eq(equipmentMaintenance.id, maintenanceId))
          .returning({
            id: equipmentMaintenance.id,
            status: equipmentMaintenance.status,
            equipmentId: equipmentMaintenance.equipmentId,
            cost: equipmentMaintenance.cost,
          });

        if (!updatedMaint[0]) {
          throw new Error('Failed to update maintenance record');
        }
        let totalCostNum = Number(updatedMaint[0].cost || 0);
        if (Array.isArray(items)) {
          await tx.delete(equipmentMaintenanceItems).where(eq(equipmentMaintenanceItems.maintenanceId, maintenanceId));
          totalCostNum = 0;
          for (const item of items) {
            const quantity = Number(item.quantity || 1);
            const unitCost = Number(item.unit_cost || 0);
            const totalCost = Number(item.total_cost ?? quantity * unitCost);
            totalCostNum += totalCost;
            await tx.insert(equipmentMaintenanceItems).values({
              maintenanceId: maintenanceId,
              name: String(item.name || 'Item'),
              description: item.description ? String(item.description) : null,
              quantity: quantity.toString(),
              unit: item.unit ? String(item.unit) : null,
              unitCost: unitCost.toString(),
              totalCost: totalCost.toString(),
              updatedAt: nowIso,
            });
          }
        }

        await tx
          .update(equipmentMaintenance)
          .set({ cost: totalCostNum.toString(), updatedAt: nowIso })
          .where(eq(equipmentMaintenance.id, maintenanceId));

        if (status) {
          const newStatus = status === 'completed' ? 'available' : 'under_maintenance';
          await tx
            .update(equipment)
            .set({ status: newStatus, lastMaintenanceDate: nowIso })
            .where(eq(equipment.id, updatedMaint[0].equipmentId));
        }

        // Return composed record with items
        const baseRows = await tx
          .select({
            id: equipmentMaintenance.id,
            equipment_id: equipmentMaintenance.equipmentId,
            title: equipmentMaintenance.title,
            description: equipmentMaintenance.description,
            status: equipmentMaintenance.status,
            type: equipmentMaintenance.type,
            priority: equipmentMaintenance.priority,
            assigned_to_employee_id: equipmentMaintenance.assignedToEmployeeId,
            scheduled_date: equipmentMaintenance.scheduledDate,
            due_date: equipmentMaintenance.dueDate,
            cost: equipmentMaintenance.cost,
            created_at: equipmentMaintenance.createdAt,
            updated_at: equipmentMaintenance.updatedAt,
            equipment: { id: equipment.id, name: equipment.name },
            mechanic: {
              id: employees.id,
              first_name: employees.firstName,
              last_name: employees.lastName,
            },
          })
          .from(equipmentMaintenance)
          .leftJoin(equipment, eq(equipment.id, equipmentMaintenance.equipmentId))
          .leftJoin(
            employees,
            eq(employees.id, equipmentMaintenance.assignedToEmployeeId)
          )
          .where(eq(equipmentMaintenance.id, maintenanceId));

        const itemsRows = await tx
          .select({
            id: equipmentMaintenanceItems.id,
            maintenance_id: equipmentMaintenanceItems.maintenanceId,
            name: equipmentMaintenanceItems.name,
            description: equipmentMaintenanceItems.description,
            quantity: equipmentMaintenanceItems.quantity,
            unit: equipmentMaintenanceItems.unit,
            unit_cost: equipmentMaintenanceItems.unitCost,
            total_cost: equipmentMaintenanceItems.totalCost,
            created_at: equipmentMaintenanceItems.createdAt,
            updated_at: equipmentMaintenanceItems.updatedAt,
          })
          .from(equipmentMaintenanceItems)
          .where(eq(equipmentMaintenanceItems.maintenanceId, maintenanceId));

        return { ...baseRows[0], items: itemsRows };
      });

      // Invalidate equipment cache to reflect status changes
      await cacheService.invalidateCacheByTag(CACHE_TAGS.EQUIPMENT);

      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      console.error('Error updating maintenance:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);

export const DELETE = withPermission(PermissionConfigs.maintenance.delete)(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const maintenanceId = parseInt(id);
      if (!maintenanceId) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
      
      console.log(`Attempting to delete maintenance record with ID: ${maintenanceId}`);
      
      await db.transaction(async tx => {
        // First get the equipment ID before deleting
        const maintenanceRecord = await tx
          .select({ equipmentId: equipmentMaintenance.equipmentId })
          .from(equipmentMaintenance)
          .where(eq(equipmentMaintenance.id, maintenanceId))
          .limit(1);
        
        if (maintenanceRecord.length > 0) {
          const equipmentId = maintenanceRecord[0].equipmentId;
          
          // Delete maintenance items and record
          await tx.delete(equipmentMaintenanceItems).where(eq(equipmentMaintenanceItems.maintenanceId, maintenanceId));
          await tx.delete(equipmentMaintenance).where(eq(equipmentMaintenance.id, maintenanceId));
          
          // Check if there are any remaining maintenance records for this equipment
          const remainingMaintenance = await tx
            .select({ id: equipmentMaintenance.id })
            .from(equipmentMaintenance)
            .where(eq(equipmentMaintenance.equipmentId, equipmentId))
            .limit(1);
          
          // If no more maintenance records, set equipment status to 'available'
          if (remainingMaintenance.length === 0) {
            await tx
              .update(equipment)
              .set({ 
                status: 'available',
                updatedAt: new Date().toISOString()
              })
              .where(eq(equipment.id, equipmentId));
            
            console.log(`Updated equipment ${equipmentId} status to 'available' after maintenance deletion`);
          }
        }
      });
      
      console.log(`Successfully deleted maintenance record with ID: ${maintenanceId}`);
      // Invalidate equipment cache to reflect status changes
      await cacheService.invalidateCacheByTag(CACHE_TAGS.EQUIPMENT);

      return NextResponse.json({ success: true, message: 'Maintenance record deleted successfully' });
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
