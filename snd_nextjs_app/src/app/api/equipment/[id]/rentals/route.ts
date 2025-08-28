import { db } from '@/lib/drizzle';
import {
  customers,
  employeeAssignments,
  employees,
  equipment,
  equipmentRentalHistory,
  projects,
  rentals,
} from '@/lib/drizzle/schema';
import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { EquipmentStatusService } from '@/lib/services/equipment-status-service';
import { withPermission } from '@/lib/rbac/api-middleware';
import { PermissionConfigs } from '@/lib/rbac/api-middleware';

// Function to update equipment status when assignment status changes
async function updateEquipmentStatusOnAssignmentChange(
  equipmentId: number,
  assignmentStatus: string
) {
  try {
    // Use the immediate status update service for real-time updates
    if (assignmentStatus === 'active') {
      await EquipmentStatusService.onAssignmentCreated(equipmentId);
    } else if (assignmentStatus === 'completed' || assignmentStatus === 'cancelled') {
      await EquipmentStatusService.onAssignmentDeleted(equipmentId);
    }
  } catch (error) {
    console.error('Error updating equipment status:', error);
  }
}

export const GET = withPermission(PermissionConfigs.equipment.read)(
  async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting equipment rental history fetch...');

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      console.log('Invalid equipment ID:', idParam);
      return NextResponse.json({ success: false, error: 'Invalid equipment ID' }, { status: 400 });
    }

    console.log('Fetching equipment with ID:', id);

    // Check if equipment exists
    const equipmentData = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);

    if (!equipmentData.length) {
      console.log('Equipment not found for ID:', id);
      return NextResponse.json({ success: false, error: 'Equipment not found' }, { status: 404 });
    }

    const equipmentItem = equipmentData[0];
    console.log('Equipment found:', equipmentItem.name);

    // Get basic rental history without JOINs first
    console.log('Fetching rental history...');
    
    const rentalHistory = await db
      .select({
        id: equipmentRentalHistory.id,
        equipmentId: equipmentRentalHistory.equipmentId,
        rentalId: equipmentRentalHistory.rentalId,
        projectId: equipmentRentalHistory.projectId,
        employeeId: equipmentRentalHistory.employeeId,
        assignmentType: equipmentRentalHistory.assignmentType,
        startDate: equipmentRentalHistory.startDate,
        endDate: equipmentRentalHistory.endDate,
        status: equipmentRentalHistory.status,
        notes: equipmentRentalHistory.notes,
        dailyRate: equipmentRentalHistory.dailyRate,
        totalAmount: equipmentRentalHistory.totalAmount,
        createdAt: equipmentRentalHistory.createdAt,
        updatedAt: equipmentRentalHistory.updatedAt,
      })
      .from(equipmentRentalHistory)
      .where(eq(equipmentRentalHistory.equipmentId, id))
      .orderBy(desc(equipmentRentalHistory.createdAt));

    console.log('Basic rental history fetched, count:', rentalHistory.length);

    // Get additional data with JOINs for complete information
    const rentalHistoryWithJoins = await db
      .select({
        id: equipmentRentalHistory.id,
        equipmentId: equipmentRentalHistory.equipmentId,
        rentalId: equipmentRentalHistory.rentalId,
        projectId: equipmentRentalHistory.projectId,
        employeeId: equipmentRentalHistory.employeeId,
        assignmentType: equipmentRentalHistory.assignmentType,
        startDate: equipmentRentalHistory.startDate,
        endDate: equipmentRentalHistory.endDate,
        status: equipmentRentalHistory.status,
        notes: equipmentRentalHistory.notes,
        dailyRate: equipmentRentalHistory.dailyRate,
        totalAmount: equipmentRentalHistory.totalAmount,
        createdAt: equipmentRentalHistory.createdAt,
        updatedAt: equipmentRentalHistory.updatedAt,
        // Rental information
        rental: {
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        },
        // Customer information
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
        },
        // Project information
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
        },
        // Employee information
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
        },
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .where(eq(equipmentRentalHistory.equipmentId, id))
      .orderBy(desc(equipmentRentalHistory.createdAt));

    console.log('Enhanced rental history fetched with JOINs, count:', rentalHistoryWithJoins.length);

    // Transform the data to match the expected format
    const history = rentalHistoryWithJoins.map(item => ({
      id: item.id,
      rental_id: item.rentalId,
      rental_number: item.rental?.rentalNumber || null,
      customer_name: item.customer?.name || null,
      customer_email: item.customer?.email || null,
      customer_phone: item.customer?.phone || null,
      project_id: item.projectId,
      project_name: item.project?.name || null,
      project_description: item.project?.description || null,
      project_status: item.project?.status || null,
      employee_id: item.employeeId,
      employee_name: item.employee 
        ? `${item.employee.firstName} ${item.employee.lastName}`.trim()
        : null,
      employee_id_number: item.employee?.fileNumber || null,
      employee_email: item.employee?.email || null,
      employee_phone: item.employee?.phone || null,
      assignment_type: item.assignmentType,
      equipment_name: equipmentItem.name,
      equipment_door_number: equipmentItem.doorNumber || null,
      quantity: 1,
      unit_price: item.dailyRate || 0,
      total_price: item.totalAmount || 0,
      rate_type: 'daily',
      status: item.status,
      notes: item.notes,
      rental_start_date: item.startDate,
      rental_expected_end_date: item.endDate,
      rental_actual_end_date: item.endDate,
      rental_status: item.status,
      created_at: item.createdAt,
      updated_at: item.updatedAt,
    }));

    console.log('History transformed successfully');

    return NextResponse.json({
      success: true,
      data: history,
      count: history.length,
      message: 'Equipment rental history loaded successfully',
    });

  } catch (error) {
    console.error('Equipment rental history error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rental history',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

export const POST = withPermission(PermissionConfigs.equipment.create)(
  async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: 'Invalid equipment ID' }, { status: 400 });
    }

    const body = await request.json();
    const {
      assignment_type,
      project_id,
      employee_id,
      start_date,
      end_date,
      daily_rate,
      total_amount,
      notes,
      status = 'active',
    } = body;

    // Validate required fields
    if (!assignment_type || !start_date) {
      return NextResponse.json(
        { success: false, error: 'Assignment type and start date are required' },
        { status: 400 }
      );
    }

    // Validate assignment type
    if (!['rental', 'project', 'manual'].includes(assignment_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid assignment type' },
        { status: 400 }
      );
    }

    // Validate project_id for project assignments
    if (assignment_type === 'project' && !project_id) {
      return NextResponse.json(
        { success: false, error: 'Project ID is required for project assignments' },
        { status: 400 }
      );
    }

    // Validate employee_id for manual assignments
    if (assignment_type === 'manual' && !employee_id) {
      return NextResponse.json(
        { success: false, error: 'Employee ID is required for manual assignments' },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const equipmentData = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);

    if (!equipmentData.length) {
      return NextResponse.json({ success: false, error: 'Equipment not found' }, { status: 404 });
    }

    const equipmentItem = equipmentData[0];
    if (!equipmentItem) {
      return NextResponse.json(
        { success: false, error: 'Equipment data not found' },
        { status: 404 }
      );
    }

    // Create the rental history entry
    const [createdRentalHistory] = await db
      .insert(equipmentRentalHistory)
      .values({
        equipmentId: id,
        rentalId: assignment_type === 'rental' ? body.rental_id : null,
        projectId: assignment_type === 'project' ? project_id : null,
        employeeId: assignment_type === 'manual' ? employee_id : null,
        assignmentType: assignment_type,
        startDate: new Date(start_date).toISOString(),
        endDate: end_date ? new Date(end_date).toISOString() : null,
        status,
        notes: notes || '',
        dailyRate: daily_rate ? parseFloat(daily_rate) : null,
        totalAmount: total_amount ? parseFloat(total_amount) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any)
      .returning();

    // Automatically update equipment status based on assignment
    await updateEquipmentStatusOnAssignmentChange(id, status);

    // Fetch the created rental history with related data
    const rentalHistory = await db
      .select({
        id: equipmentRentalHistory.id,
        equipmentId: equipmentRentalHistory.equipmentId,
        rentalId: equipmentRentalHistory.rentalId,
        projectId: equipmentRentalHistory.projectId,
        employeeId: equipmentRentalHistory.employeeId,
        assignmentType: equipmentRentalHistory.assignmentType,
        startDate: equipmentRentalHistory.startDate,
        endDate: equipmentRentalHistory.endDate,
        status: equipmentRentalHistory.status,
        notes: equipmentRentalHistory.notes,
        dailyRate: equipmentRentalHistory.dailyRate,
        totalAmount: equipmentRentalHistory.totalAmount,
        createdAt: equipmentRentalHistory.createdAt,
        updatedAt: equipmentRentalHistory.updatedAt,
        rental: {
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
          customer: {
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
          },
        } as any,
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
        },
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
        },
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .where(eq(equipmentRentalHistory.id, createdRentalHistory?.id || 0))
      .limit(1);

    // If this is a manual assignment with an employee, also create an employee assignment
    let employeeAssignment: any = null;
    if (assignment_type === 'manual' && employee_id) {
      try {
        employeeAssignment = await db
          .insert(employeeAssignments)
          .values({
            employeeId: parseInt(employee_id),
            name: `Equipment Assignment - ${equipmentItem.name}`,
            type: 'manual',
            location: body.location || null,
            startDate: new Date(start_date).toISOString(),
            endDate: end_date ? new Date(end_date).toISOString() : null,
            status: 'active',
            notes: `Manual equipment assignment: ${notes || 'No additional notes'}`,
            projectId: null,
            rentalId: null,
            updatedAt: new Date().toISOString(),
          })
          .returning();

      } catch (assignmentError) {
        
        // Don't fail the equipment assignment if employee assignment creation fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          rentalHistory: rentalHistory[0],
          employeeAssignment: employeeAssignment?.[0] || null,
        },
        message:
          'Equipment assignment created successfully' +
          (employeeAssignment ? ' and employee assignment created automatically' : ''),
      },
      { status: 201 }
    );
  } catch (error) {
    
    return NextResponse.json(
      { success: false, error: 'Failed to create equipment assignment' },
      { status: 500 }
    );
  }
});
