import { db } from '@/lib/db';
import {
  employees as employeesTable,
  equipmentMaintenance as equipmentMaintenanceTable,
  equipment as equipmentTable,
  equipmentMaintenanceItems as maintenanceItemsTable,
} from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { and, desc, eq, gte, inArray, lte } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';
import { cacheService } from '@/lib/redis';
import { CACHE_TAGS } from '@/lib/redis';

function parseNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export const GET = withPermission(PermissionConfigs.maintenance.read)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = parseNumber(searchParams.get('equipmentId'));
    const mechanicId = parseNumber(searchParams.get('mechanicId'));
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    const filters: any[] = [];
    if (equipmentId) filters.push(eq(equipmentMaintenanceTable.equipmentId, equipmentId));
    if (mechanicId) filters.push(eq(equipmentMaintenanceTable.assignedToEmployeeId, mechanicId));
    if (status) filters.push(eq(equipmentMaintenanceTable.status, status));
    if (type) filters.push(eq(equipmentMaintenanceTable.type, type));
    if (start)
      filters.push(gte(equipmentMaintenanceTable.scheduledDate, new Date(start).toISOString()));
    if (end)
      filters.push(lte(equipmentMaintenanceTable.scheduledDate, new Date(end).toISOString()));

    const maintenanceRows = await db
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
          doorNumber: equipmentTable.doorNumber,
        },
        mechanic: {
          id: employeesTable.id,
          first_name: employeesTable.firstName,
          last_name: employeesTable.lastName,
        },
      })
      .from(equipmentMaintenanceTable)
      .leftJoin(equipmentTable, eq(equipmentTable.id, equipmentMaintenanceTable.equipmentId))
      .leftJoin(
        employeesTable,
        eq(employeesTable.id, equipmentMaintenanceTable.assignedToEmployeeId)
      )
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(desc(equipmentMaintenanceTable.createdAt));

    const maintenanceIds = maintenanceRows.map(r => r.id);
    let itemsByMaintenanceId: Record<number, any[]> = {};
    if (maintenanceIds.length > 0) {
      const itemRows = await db
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
        .where(inArray(maintenanceItemsTable.maintenanceId, maintenanceIds));

      itemsByMaintenanceId = itemRows.reduce((acc: Record<number, any[]>, item) => {
        const key = Number(item.maintenance_id);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});
    }

    const records = maintenanceRows.map(r => ({
      ...r,
      items: itemsByMaintenanceId[r.id] || [],
    }));

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withPermission(PermissionConfigs.maintenance.create)(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const {
        equipment_id,
        assigned_to_employee_id,
        type,
        title,
        description,
        scheduled_date,
        due_date,
        status,
        items = [],
      } = body;

      if (!equipment_id) {
        return NextResponse.json(
          { success: false, message: 'equipment_id is required' },
          { status: 400 }
        );
      }

      const nowIso = new Date().toISOString();
      const created = await db.transaction(async tx => {
        const inserted = await tx
          .insert(equipmentMaintenanceTable)
          .values({
            equipmentId: equipment_id,
            assignedToEmployeeId: assigned_to_employee_id || null,
            type: type || 'corrective',
            title: title || 'Maintenance',
            description: description || null,
            scheduledDate: scheduled_date ? new Date(scheduled_date).toISOString() : null,
            dueDate: due_date ? new Date(due_date).toISOString() : null,
            status: status || 'open',
            updatedAt: nowIso,
          })
          .returning({
            id: equipmentMaintenanceTable.id,
            status: equipmentMaintenanceTable.status,
          });
        if (!inserted[0]) {
          throw new Error('Failed to create maintenance record');
        }
        const maintenanceId = inserted[0].id;

        let totalCostNum = 0;
        if (Array.isArray(items) && items.length) {
          for (const item of items) {
            const quantity = Number(item.quantity || 1);
            const unitCost = Number(item.unit_cost || 0);
            const totalCost = Number(item.total_cost ?? quantity * unitCost);
            totalCostNum += totalCost;
            await tx.insert(maintenanceItemsTable).values({
              maintenanceId,
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

        const updatedMaintenance = await tx
          .update(equipmentMaintenanceTable)
          .set({ cost: totalCostNum.toString(), updatedAt: nowIso })
          .where(eq(equipmentMaintenanceTable.id, maintenanceId))
          .returning({
            id: equipmentMaintenanceTable.id,
            status: equipmentMaintenanceTable.status,
            equipmentId: equipmentMaintenanceTable.equipmentId,
          });

        if (!updatedMaintenance[0]) {
          throw new Error('Failed to update maintenance record');
        }

        const newStatus =
          updatedMaintenance[0].status === 'completed' ? 'available' : 'under_maintenance';
        await tx
          .update(equipmentTable)
          .set({ status: newStatus, lastMaintenanceDate: nowIso })
          .where(eq(equipmentTable.id, updatedMaintenance[0].equipmentId));

        return updatedMaintenance[0];
      });

      // Immediately update equipment status using our service
      try {
        await EquipmentStatusService.onMaintenanceCreated(created.equipmentId);
      } catch (statusError) {
        console.error('Error updating equipment status immediately:', statusError);
        // Don't fail the maintenance creation if status update fails
      }

      // Invalidate equipment cache to reflect status changes
      await cacheService.invalidateCacheByTag(CACHE_TAGS.EQUIPMENT);

      return NextResponse.json({ success: true, data: created });
    } catch (error) {
      console.error('Error creating maintenance:', error);
      return NextResponse.json(
        { success: false, message: 'Internal server error' },
        { status: 500 }
      );
    }
  }
);
