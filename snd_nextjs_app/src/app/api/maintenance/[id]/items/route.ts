import { NextRequest, NextResponse } from 'next/server';
import { prisma, safePrismaOperation } from '@/lib/db';
import { withPermission } from '@/lib/rbac/api-middleware';

export const POST = withPermission(async (request: NextRequest, { params }: { params: { id: string } }) => {
  try {
    const id = parseInt(params.id);
    if (!id) return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });

    const body = await request.json();
    const name = String(body.name || '').trim();
    const quantity = Number(body.quantity || 1);
    const unit_cost = Number(body.unit_cost || 0);
    const unit = body.unit ? String(body.unit) : null;
    const description = body.description ? String(body.description) : null;
    const total_cost = Number(body.total_cost ?? quantity * unit_cost);

    if (!name) {
      return NextResponse.json({ success: false, message: 'Item name is required' }, { status: 400 });
    }

    const result = await safePrismaOperation(async () => {
      return prisma.$transaction(async (tx) => {
        await tx.equipmentMaintenanceItem.create({
          data: { maintenance_id: id, name, quantity, unit_cost, unit, description, total_cost },
        });

        const sum = await tx.equipmentMaintenanceItem.aggregate({
          where: { maintenance_id: id },
          _sum: { total_cost: true },
        });
        const newCost = Number(sum._sum.total_cost || 0);

        const updated = await tx.equipmentMaintenance.update({
          where: { id },
          data: { cost: newCost },
          include: { items: true },
        });

        return updated;
      });
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('POST /api/maintenance/[id]/items error:', error);
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}, { action: 'update', subject: 'Maintenance', fallbackAction: 'update', fallbackSubject: 'Equipment' });


