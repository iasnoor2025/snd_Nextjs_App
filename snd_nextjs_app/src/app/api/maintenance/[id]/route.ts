import { NextRequest, NextResponse } from 'next/server';
import { prisma, safePrismaOperation } from '@/lib/db';
import { withAuth, withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';

export const GET = withAuth(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
    const record = await safePrismaOperation(() =>
      prisma.equipmentMaintenance.findUnique({
        where: { id },
        include: {
          equipment: { select: { id: true, name: true } },
          mechanic: { select: { id: true, first_name: true, last_name: true } },
          items: true,
        },
      })
    );
    if (!record) return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: record });
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

    const updated = await safePrismaOperation(async () => {
      const result = await prisma.$transaction(async (tx) => {
        const maintenance = await tx.equipmentMaintenance.update({
          where: { id },
          data: {
            status: status ?? undefined,
            assigned_to_employee_id: assigned_to_employee_id ?? undefined,
            type: type ?? undefined,
            title: title ?? undefined,
            description: description ?? undefined,
            scheduled_date: scheduled_date ? new Date(scheduled_date) : undefined,
            due_date: due_date ? new Date(due_date) : undefined,
          },
        });

        let totalCost = Number(maintenance.cost || 0);
        if (Array.isArray(items)) {
          // Simplest approach: replace items if provided
          await tx.equipmentMaintenanceItem.deleteMany({ where: { maintenance_id: id } });
          totalCost = 0;
          for (const item of items) {
            const quantity = Number(item.quantity || 1);
            const unit_cost = Number(item.unit_cost || 0);
            const total_cost = Number(item.total_cost ?? quantity * unit_cost);
            totalCost += total_cost;
            await tx.equipmentMaintenanceItem.create({
              data: {
                maintenance_id: id,
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

        const finalMaintenance = await tx.equipmentMaintenance.update({
          where: { id },
          data: { cost: totalCost },
          include: { items: true, equipment: true },
        });

        // Update equipment status if status changed to completed
        if (status) {
          let equipmentStatus = 'under_maintenance';
          if (status === 'completed') equipmentStatus = 'available';
          await tx.equipment.update({
            where: { id: finalMaintenance.equipment_id },
            data: { status: equipmentStatus, last_maintenance_date: new Date() },
          });
        }

        return finalMaintenance;
      });
      return result;
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
    await safePrismaOperation(async () => {
      await prisma.$transaction(async (tx) => {
        await tx.equipmentMaintenanceItem.deleteMany({ where: { maintenance_id: id } });
        await tx.equipmentMaintenance.delete({ where: { id } });
      });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/maintenance/[id] error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}, { action: 'delete', subject: 'Maintenance', fallbackAction: 'update', fallbackSubject: 'Equipment' });


