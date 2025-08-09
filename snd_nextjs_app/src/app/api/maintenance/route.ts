import { NextRequest, NextResponse } from 'next/server';
import { prisma, safePrismaOperation } from '@/lib/db';
import { withAuth, PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';

function parseNumber(value: any): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  return Number.isNaN(n) ? undefined : n;
}

export const GET = withAuth(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const equipmentId = parseNumber(searchParams.get('equipmentId'));
    const mechanicId = parseNumber(searchParams.get('mechanicId'));
    const status = searchParams.get('status') || undefined;
    const type = searchParams.get('type') || undefined;
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');

    const where: any = {};
    if (equipmentId) where.equipment_id = equipmentId;
    if (mechanicId) where.assigned_to_employee_id = mechanicId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (start || end) {
      where.scheduled_date = {};
      if (start) where.scheduled_date.gte = new Date(start);
      if (end) where.scheduled_date.lte = new Date(end);
    }

    const records = await safePrismaOperation(() =>
      prisma.equipmentMaintenance.findMany({
        where,
        orderBy: { created_at: 'desc' },
        include: {
          equipment: { select: { id: true, name: true } },
          mechanic: { select: { id: true, first_name: true, last_name: true } },
          items: true,
        },
      })
    );

    return NextResponse.json({ success: true, data: records });
  } catch (error) {
    console.error('GET /api/maintenance error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withPermission(async (request: NextRequest) => {
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
      return NextResponse.json({ success: false, message: 'equipment_id is required' }, { status: 400 });
    }

    const created = await safePrismaOperation(async () => {
      const result = await prisma.$transaction(async (tx) => {
        const maintenance = await tx.equipmentMaintenance.create({
          data: {
            equipment_id,
            assigned_to_employee_id: assigned_to_employee_id || null,
            type: type || 'corrective',
            title: title || 'Maintenance',
            description: description || null,
            scheduled_date: scheduled_date ? new Date(scheduled_date) : null,
            due_date: due_date ? new Date(due_date) : null,
            status: status || 'open',
          },
        });

        // Create items and sum cost
        let totalCost = 0;
        if (Array.isArray(items) && items.length) {
          for (const item of items) {
            const quantity = Number(item.quantity || 1);
            const unit_cost = Number(item.unit_cost || 0);
            const total_cost = Number(item.total_cost ?? quantity * unit_cost);
            totalCost += total_cost;
            await tx.equipmentMaintenanceItem.create({
              data: {
                maintenance_id: maintenance.id,
                name: String(item.name || 'Item'),
                description: item.description || null,
                quantity,
                unit: item.unit || null,
                unit_cost,
                total_cost,
              },
            });
          }
        }

        // Update maintenance total cost
        const updatedMaintenance = await tx.equipmentMaintenance.update({
          where: { id: maintenance.id },
          data: { cost: totalCost },
        });

        // Update equipment status depending on maintenance status/type
        let equipmentStatus = 'under_maintenance';
        if (updatedMaintenance.status === 'completed') {
          equipmentStatus = 'available';
        }
        await tx.equipment.update({
          where: { id: equipment_id },
          data: { status: equipmentStatus, last_maintenance_date: new Date() },
        });

        return updatedMaintenance;
      });
      return result;
    });

    return NextResponse.json({ success: true, data: created });
  } catch (error) {
    console.error('POST /api/maintenance error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}, { action: 'create', subject: 'Maintenance', fallbackAction: 'update', fallbackSubject: 'Equipment' });


