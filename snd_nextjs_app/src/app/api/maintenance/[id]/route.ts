import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withAuth, withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import {
  equipmentMaintenance as equipmentMaintenanceTable,
  equipment as equipmentTable,
  employees as employeesTable,
  equipmentMaintenanceItems as maintenanceItemsTable,
} from '@/lib/drizzle/schema';
import { and, desc, eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

export const GET = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

    const rows = await db
      .select({
        id: equipmentMaintenanceTable.id,
        equipment_id: equipmentMaintenanceTable.equipmentId,
        title: equipmentMaintenanceTable.title,
        description: equipmentMaintenanceTable.description,
        status: equipmentMaintenanceTable.status,
        type: equipmentMaintenanceTable.type,
        priority: equipmentMaintenanceTable.priority,
        assigned_to_employee_id: equipmentMaintenanceTable.assignedToEmployeeId,
        scheduled_date: equipmentMaintenanceTable.scheduledDate,
        due_date: equipmentMaintenanceTable.dueDate,
        cost: equipmentMaintenanceTable.cost,
        created_at: equipmentMaintenanceTable.createdAt,
        updated_at: equipmentMaintenanceTable.updatedAt,
        equipment: {
          id: equipmentTable.id,
          name: equipmentTable.name,
        },
        mechanic: {
          id: employeesTable.id,
          first_name: employeesTable.firstName,
          last_name: employeesTable.lastName,
        },
      })
      .from(equipmentMaintenanceTable)
      .leftJoin(equipmentTable, eq(equipmentTable.id, equipmentMaintenanceTable.equipmentId))
      .leftJoin(employeesTable, eq(employeesTable.id, equipmentMaintenanceTable.assignedToEmployeeId))
      .where(eq(equipmentMaintenanceTable.id, id));

    const base = rows[0];
    if (!base) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });

    const items = await db
      .select({
        id: maintenanceItemsTable.id,
        maintenance_id: maintenanceItemsTable.maintenanceId,
        name: maintenanceItemsTable.name,
        description: maintenanceItemsTable.description,
        quantity: maintenanceItemsTable.quantity,
        unit: maintenanceItemsTable.unit,
        unit_cost: maintenanceItemsTable.unitCost,
        total_cost: maintenanceItemsTable.totalCost,
        created_at: maintenanceItemsTable.createdAt,
        updated_at: maintenanceItemsTable.updatedAt,
      })
      .from(maintenanceItemsTable)
      .where(eq(maintenanceItemsTable.maintenanceId, id));

    return NextResponse.json({ success: true, data: { ...base, items } });
  } catch (error) {
    console.error('GET /api/maintenance/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = withPermission(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    const body = await request.json();
    const { status, assigned_to_employee_id, type, title, description, scheduled_date, due_date, items } = body;

    const nowIso = new Date().toISOString();
    const dataToUpdate: any = { updatedAt: nowIso };
    if (status !== undefined) dataToUpdate.status = status;
    if (assigned_to_employee_id !== undefined) dataToUpdate.assignedToEmployeeId = assigned_to_employee_id;
    if (type !== undefined) dataToUpdate.type = type;
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description;
    if (scheduled_date !== undefined) dataToUpdate.scheduledDate = scheduled_date ? new Date(scheduled_date).toISOString() : null;
    if (due_date !== undefined) dataToUpdate.dueDate = due_date ? new Date(due_date).toISOString() : null;

    const updated = await db.transaction(async (tx) => {
      const updatedMaint = await tx
        .update(equipmentMaintenanceTable)
        .set(dataToUpdate)
        .where(eq(equipmentMaintenanceTable.id, id))
        .returning({
          id: equipmentMaintenanceTable.id,
          status: equipmentMaintenanceTable.status,
          equipmentId: equipmentMaintenanceTable.equipmentId,
          cost: equipmentMaintenanceTable.cost,
        });

      let totalCostNum = Number(updatedMaint[0].cost || 0);
      if (Array.isArray(items)) {
        await tx.delete(maintenanceItemsTable).where(eq(maintenanceItemsTable.maintenanceId, id));
        totalCostNum = 0;
        for (const item of items) {
          const quantity = Number(item.quantity || 1);
          const unitCost = Number(item.unit_cost || 0);
          const totalCost = Number(item.total_cost ?? quantity * unitCost);
          totalCostNum += totalCost;
          await tx.insert(maintenanceItemsTable).values({
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
        .update(equipmentMaintenanceTable)
        .set({ cost: String(totalCostNum) as any, updatedAt: nowIso })
        .where(eq(equipmentMaintenanceTable.id, id));

      if (status) {
        const newStatus = status === 'completed' ? 'available' : 'under_maintenance';
        await tx
          .update(equipmentTable)
          .set({ status: newStatus, lastMaintenanceDate: nowIso })
          .where(eq(equipmentTable.id, updatedMaint[0].equipmentId));
      }

      // Return composed record with items
      const baseRows = await tx
        .select({
          id: equipmentMaintenanceTable.id,
          equipment_id: equipmentMaintenanceTable.equipmentId,
          title: equipmentMaintenanceTable.title,
          description: equipmentMaintenanceTable.description,
          status: equipmentMaintenanceTable.status,
          type: equipmentMaintenanceTable.type,
          priority: equipmentMaintenanceTable.priority,
          assigned_to_employee_id: equipmentMaintenanceTable.assignedToEmployeeId,
          scheduled_date: equipmentMaintenanceTable.scheduledDate,
          due_date: equipmentMaintenanceTable.dueDate,
          cost: equipmentMaintenanceTable.cost,
          created_at: equipmentMaintenanceTable.createdAt,
          updated_at: equipmentMaintenanceTable.updatedAt,
          equipment: { id: equipmentTable.id, name: equipmentTable.name },
          mechanic: { id: employeesTable.id, first_name: employeesTable.firstName, last_name: employeesTable.lastName },
        })
        .from(equipmentMaintenanceTable)
        .leftJoin(equipmentTable, eq(equipmentTable.id, equipmentMaintenanceTable.equipmentId))
        .leftJoin(employeesTable, eq(employeesTable.id, equipmentMaintenanceTable.assignedToEmployeeId))
        .where(eq(equipmentMaintenanceTable.id, id));

      const itemsRows = await tx
        .select({
          id: maintenanceItemsTable.id,
          maintenance_id: maintenanceItemsTable.maintenanceId,
          name: maintenanceItemsTable.name,
          description: maintenanceItemsTable.description,
          quantity: maintenanceItemsTable.quantity,
          unit: maintenanceItemsTable.unit,
          unit_cost: maintenanceItemsTable.unitCost,
          total_cost: maintenanceItemsTable.totalCost,
          created_at: maintenanceItemsTable.createdAt,
          updated_at: maintenanceItemsTable.updatedAt,
        })
        .from(maintenanceItemsTable)
        .where(eq(maintenanceItemsTable.maintenanceId, id));

      return { ...baseRows[0], items: itemsRows };
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('PUT /api/maintenance/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}, { action: 'update', subject: 'Maintenance', fallbackAction: 'update', fallbackSubject: 'Equipment' });

export const DELETE = withPermission(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    await db.transaction(async (tx) => {
      await tx.delete(maintenanceItemsTable).where(eq(maintenanceItemsTable.maintenanceId, id));
      await tx.delete(equipmentMaintenanceTable).where(eq(equipmentMaintenanceTable.id, id));
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/maintenance/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}, { action: 'delete', subject: 'Maintenance', fallbackAction: 'update', fallbackSubject: 'Equipment' });


