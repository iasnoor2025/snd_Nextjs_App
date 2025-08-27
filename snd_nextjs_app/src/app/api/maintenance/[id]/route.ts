import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { db } from '@/lib/db';
import { maintenance, equipment, employees, equipmentMaintenanceItems } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export const GET = withPermission(PermissionConfigs.maintenance.read)(
  async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    try {
      const { id } = await params;
      const maintenanceId = parseInt(id);
      if (!maintenanceId) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

      const rows = await db
        .select({
          id: maintenance.id,
          equipment_id: maintenance.equipmentId,
          title: maintenance.title,
          description: maintenance.description,
          status: maintenance.status,
          type: maintenance.type,
          priority: maintenance.priority,
          assigned_to_employee_id: maintenance.assignedToEmployeeId,
          scheduled_date: maintenance.scheduledDate,
          due_date: maintenance.dueDate,
          cost: maintenance.cost,
          created_at: maintenance.createdAt,
          updated_at: maintenance.updatedAt,
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
        .from(maintenance)
        .leftJoin(equipment, eq(equipment.id, maintenance.equipmentId))
        .leftJoin(
          employees,
          eq(employees.id, maintenance.assignedToEmployeeId)
        )
        .where(eq(maintenance.id, maintenanceId));

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

export const PUT = withPermission(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = parseInt(params.id);
      if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
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
          .update(maintenance)
          .set(dataToUpdate)
          .where(eq(maintenance.id, id))
          .returning({
            id: maintenance.id,
            status: maintenance.status,
            equipmentId: maintenance.equipmentId,
            cost: maintenance.cost,
          });

        if (!updatedMaint[0]) {
          throw new Error('Failed to update maintenance record');
        }
        let totalCostNum = Number(updatedMaint[0].cost || 0);
        if (Array.isArray(items)) {
          await tx.delete(equipmentMaintenanceItems).where(eq(equipmentMaintenanceItems.maintenanceId, id));
          totalCostNum = 0;
          for (const item of items) {
            const quantity = Number(item.quantity || 1);
            const unitCost = Number(item.unit_cost || 0);
            const totalCost = Number(item.total_cost ?? quantity * unitCost);
            totalCostNum += totalCost;
            await tx.insert(equipmentMaintenanceItems).values({
              maintenanceId: id,
              name: String(item.name || 'Item'),
              description: item.description ? String(item.description) : null,
              quantity: String(quantity) as any,
              unit: item.unit ? String(item.unit) : null,
              unitCost: String(unitCost) as any,
              totalCost: String(totalCost) as any,
              updatedAt: nowIso,
            });
          }
        }

        await tx
          .update(maintenance)
          .set({ cost: String(totalCostNum) as any, updatedAt: nowIso })
          .where(eq(maintenance.id, id));

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
            id: maintenance.id,
            equipment_id: maintenance.equipmentId,
            title: maintenance.title,
            description: maintenance.description,
            status: maintenance.status,
            type: maintenance.type,
            priority: maintenance.priority,
            assigned_to_employee_id: maintenance.assignedToEmployeeId,
            scheduled_date: maintenance.scheduledDate,
            due_date: maintenance.dueDate,
            cost: maintenance.cost,
            created_at: maintenance.createdAt,
            updated_at: maintenance.updatedAt,
            equipment: { id: equipment.id, name: equipment.name },
            mechanic: {
              id: employees.id,
              first_name: employees.firstName,
              last_name: employees.lastName,
            },
          })
          .from(maintenance)
          .leftJoin(equipment, eq(equipment.id, maintenance.equipmentId))
          .leftJoin(
            employees,
            eq(employees.id, maintenance.assignedToEmployeeId)
          )
          .where(eq(maintenance.id, id));

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
          .where(eq(equipmentMaintenanceItems.maintenanceId, id));

        return { ...baseRows[0], items: itemsRows };
      });

      return NextResponse.json({ success: true, data: updated });
    } catch (error) {
      
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    action: 'update',
    subject: 'Maintenance',
    fallbackAction: 'update',
    fallbackSubject: 'Equipment',
  }
);

export const DELETE = withPermission(
  async (_request: NextRequest, { params }: { params: { id: string } }) => {
    try {
      const id = parseInt(params.id);
      if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
      await db.transaction(async tx => {
        await tx.delete(equipmentMaintenanceItems).where(eq(equipmentMaintenanceItems.maintenanceId, id));
        await tx.delete(maintenance).where(eq(maintenance.id, id));
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    action: 'delete',
    subject: 'Maintenance',
    fallbackAction: 'update',
    fallbackSubject: 'Equipment',
  }
);
