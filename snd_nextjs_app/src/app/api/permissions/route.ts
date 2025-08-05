import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { prisma } from '@/lib/db';
import { hasPermission, createUserFromSession } from '@/lib/rbac/custom-rbac';

// GET /api/permissions - List all permissions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Check if user has permission to view permissions
    if (!hasPermission(user, 'read', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { guard_name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Get permissions with pagination
    const [permissions, total] = await Promise.all([
      prisma.permission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          role_permissions: {
            include: {
              role: true,
            },
          },
        },
      }),
      prisma.permission.count({ where }),
    ]);

    // If role filter is specified, filter permissions by role
    let filteredPermissions = permissions;
    if (role) {
      filteredPermissions = permissions.filter(permission =>
        permission.role_permissions.some(rp => rp.role.name === role)
      );
    }

    return NextResponse.json({
      permissions: filteredPermissions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/permissions - Create new permission
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = createUserFromSession(session);
    if (!user) {
      return NextResponse.json({ error: 'Invalid user session' }, { status: 401 });
    }

    // Check if user has permission to create permissions
    if (!hasPermission(user, 'create', 'Settings')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, guard_name = 'web' } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Permission name is required' },
        { status: 400 }
      );
    }

    // Check if permission already exists
    const existingPermission = await prisma.permission.findUnique({
      where: { name },
    });

    if (existingPermission) {
      return NextResponse.json(
        { error: 'Permission already exists' },
        { status: 409 }
      );
    }

    // Create new permission
    const permission = await prisma.permission.create({
      data: {
        name,
        guard_name,
      },
    });

    return NextResponse.json({
      message: 'Permission created successfully',
      permission,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating permission:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 