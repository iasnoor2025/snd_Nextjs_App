
import { db } from '@/lib/drizzle';
import { analyticsReports } from '@/lib/drizzle/schema';
import { getRBACPermissions } from '@/lib/rbac/rbac-utils';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('read', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const reportRows = await db
      .select()
      .from(analyticsReports)
      .where(eq(analyticsReports.id, parseInt(id)))
      .limit(1);

    if (reportRows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(reportRows[0]);
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('update', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, type, description, schedule, parameters, status } = body;

    const reportRows = await db
      .update(analyticsReports)
      .set({
        name,
        type,
        description,
        schedule,
        parameters: parameters ? JSON.stringify(parameters) : null,
        status,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(analyticsReports.id, parseInt(id)))
      .returning();

    if (reportRows.length === 0) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json(reportRows[0]);
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check RBAC permissions
    const permissions = await getRBACPermissions(session.user.id);
    if (!permissions.can('delete', 'Report')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await db
      .update(analyticsReports)
      .set({ isActive: false })
      .where(eq(analyticsReports.id, parseInt(id)));

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error) {
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
