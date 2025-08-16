import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';
import { equipmentMaintenance as equipmentMaintenanceTable, equipmentMaintenanceItems as maintenanceItemsTable } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

export const POST = withPermission(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

    const body = await _request.json();
    const name = String(body.name || '').trim();
    const quantity = Number(body.quantity || 1);
    const unit_cost = Number(body.unit_cost || 0);
    const unit = body.unit ? String(body.unit) : null;
    const description = body.description ? String(body.description) : null;
    const total_cost = Number(body.total_cost ?? quantity * unit_cost);

    if (!name) {
      return NextResponse.json({ success: false, message: 'Item name is required' }, { status: 400 });
    }

    const nowIso = new Date().toISOString();
    const result = await db.transaction(async (tx) => {
      await tx.insert(maintenanceItemsTable).values({
        maintenanceId: id,
        name,
        description,
        quantity: String(quantity) as any,
        unit,
        unitCost: String(unit_cost) as any,
        totalCost: String(total_cost) as any,
        updatedAt: nowIso,
      });

      // Recompute cost by summing items
      const items = await tx
        .select({ total_cost: maintenanceItemsTable.totalCost })
        .from(maintenanceItemsTable)
        .where(eq(maintenanceItemsTable.maintenanceId, id));
      const newCost = items.reduce((sum, row) => sum + Number(row.total_cost || 0), 0);

      await tx
        .update(equipmentMaintenanceTable)
        .set({ cost: String(newCost) as any, updatedAt: nowIso })
        .where(eq(equipmentMaintenanceTable.id, id));

      const updated = await tx
        .select()
        .from(maintenanceItemsTable)
        .where(eq(maintenanceItemsTable.maintenanceId, id));

      return { items: updated, cost: newCost };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('POST /api/maintenance/[id]/items error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}, { action: 'update', subject: 'Maintenance', fallbackAction: 'update', fallbackSubject: 'Equipment' });


