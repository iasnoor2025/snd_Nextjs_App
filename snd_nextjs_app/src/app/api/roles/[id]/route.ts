import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Define role permissions based on the ability system
const rolePermissions = {
  SUPER_ADMIN: [
    'users.read', 'users.create', 'users.update', 'users.delete',
    'roles.read', 'roles.create', 'roles.update', 'roles.delete',
    'equipment.read', 'equipment.create', 'equipment.update', 'equipment.delete',
    'rentals.read', 'rentals.create', 'rentals.update', 'rentals.delete',
    'employees.read', 'employees.create', 'employees.update', 'employees.delete',
    'projects.read', 'projects.create', 'projects.update', 'projects.delete',
    'reports.read', 'reports.create', 'reports.export',
    'settings.read', 'settings.update',
    'analytics.read', 'analytics.export',
    // Timesheet permissions - full access
    'timesheets.read', 'timesheets.create', 'timesheets.update', 'timesheets.delete',
    'timesheets.approve', 'timesheets.reject',
    'timesheets.approve.foreman', 'timesheets.approve.incharge', 'timesheets.approve.checking', 'timesheets.approve.manager',
  ],
  ADMIN: [
    'users.read', 'users.create', 'users.update', 'users.delete',
    'roles.read', 'roles.create', 'roles.update', 'roles.delete',
    'equipment.read', 'equipment.create', 'equipment.update', 'equipment.delete',
    'rentals.read', 'rentals.create', 'rentals.update', 'rentals.delete',
    'employees.read', 'employees.create', 'employees.update', 'employees.delete',
    'projects.read', 'projects.create', 'projects.update', 'projects.delete',
    'reports.read', 'reports.create', 'reports.export',
    'settings.read', 'settings.update',
    'analytics.read', 'analytics.export',
    // Timesheet permissions - full access
    'timesheets.read', 'timesheets.create', 'timesheets.update', 'timesheets.delete',
    'timesheets.approve', 'timesheets.reject',
    'timesheets.approve.foreman', 'timesheets.approve.incharge', 'timesheets.approve.checking', 'timesheets.approve.manager',
  ],
  MANAGER: [
    'employees.read', 'employees.update',
    'equipment.read', 'equipment.update',
    'rentals.read', 'rentals.create', 'rentals.update',
    'projects.read', 'projects.create', 'projects.update',
    'reports.read', 'reports.export',
    'settings.read',
    // Timesheet permissions - manager level
    'timesheets.read', 'timesheets.create', 'timesheets.update',
    'timesheets.approve', 'timesheets.reject',
    'timesheets.approve.manager',
  ],
  SUPERVISOR: [
    'employees.read',
    'equipment.read',
    'rentals.read', 'rentals.create', 'rentals.update',
    'projects.read', 'projects.create', 'projects.update',
    'reports.read',
    // Timesheet permissions - supervisor level
    'timesheets.read', 'timesheets.create', 'timesheets.update',
    'timesheets.approve.foreman', 'timesheets.approve.incharge',
  ],
  OPERATOR: [
    'employees.read', 'employees.update',
    'equipment.read',
    'rentals.read', 'rentals.create', 'rentals.update',
    'projects.read',
    // Timesheet permissions - operator level
    'timesheets.read', 'timesheets.create', 'timesheets.update',
    'timesheets.approve.foreman',
  ],
  EMPLOYEE: [
    'employees.read', 'employees.update',
    'equipment.read',
    'rentals.read', 'rentals.create', 'rentals.update',
    'projects.read',
    // Timesheet permissions - employee level
    'timesheets.read', 'timesheets.create', 'timesheets.update',
  ],
  USER: [
    'employees.read',
    'equipment.read',
    'rentals.read',
    'projects.read',
    // Timesheet permissions - read only
    'timesheets.read',
  ],
};

// Define role descriptions
const roleDescriptions = {
  SUPER_ADMIN: 'Full system access with all permissions including all timesheet approval stages',
  ADMIN: 'System administration with comprehensive access including all timesheet approval stages',
  MANAGER: 'Department management with limited administrative access and final timesheet approval',
  SUPERVISOR: 'Team supervision with operational access and foreman/incharge timesheet approval',
  OPERATOR: 'Basic operations with limited access and foreman timesheet approval',
  EMPLOYEE: 'Employee access for personal data management and timesheet creation',
  USER: 'Read-only access to basic system features and timesheet viewing',
};

// GET /api/roles/[id] - Get role by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            user_roles: true,
          },
        },
      },
    });

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    const roleWithUserCount = {
      id: role.id,
      name: role.name,
      description: roleDescriptions[role.name as keyof typeof roleDescriptions] || '',
      permissions: rolePermissions[role.name as keyof typeof rolePermissions] || [],
      isActive: true,
      createdAt: role.created_at.toISOString(),
      userCount: role._count.user_roles,
    };

    return NextResponse.json(roleWithUserCount);
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles/[id] - Update role by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Role name is required' },
        { status: 400 }
      );
    }

    // Check if role exists
    const existingRole = await prisma.role.findUnique({
      where: { id: parseInt(id) },
    });

    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    // Check if name is being changed and if it conflicts with another role
    if (body.name !== existingRole.name) {
      const conflictingRole = await prisma.role.findUnique({
        where: { name: body.name },
      });

      if (conflictingRole) {
        return NextResponse.json(
          { error: 'Role with this name already exists' },
          { status: 400 }
        );
      }
    }

    // Update role
    const updatedRole = await prisma.role.update({
      where: { id: parseInt(id) },
      data: {
        name: body.name,
      },
      include: {
        _count: {
          select: {
            user_roles: true,
          },
        },
      },
    });

    const roleWithUserCount = {
      id: updatedRole.id,
      name: updatedRole.name,
      description: roleDescriptions[updatedRole.name as keyof typeof roleDescriptions] || '',
      permissions: rolePermissions[updatedRole.name as keyof typeof rolePermissions] || [],
      isActive: true,
      createdAt: updatedRole.created_at.toISOString(),
      userCount: updatedRole._count.user_roles,
    };

    return NextResponse.json(roleWithUserCount);
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}
