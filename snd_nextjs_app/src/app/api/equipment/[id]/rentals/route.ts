import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { equipment, equipmentRentalHistory, rentals, customers, projects, employees, users, employeeAssignments } from '@/lib/drizzle/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
    }

    // Check if equipment exists
    const equipmentData = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);

    if (!equipmentData.length) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Fetch rental history for this equipment from the new EquipmentRentalHistory table
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
            phone: customers.phone
          }
        },
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status
        },
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone
        }
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .where(eq(equipmentRentalHistory.equipmentId, id))
      .orderBy(desc(equipmentRentalHistory.createdAt));

    // Transform the data to include more useful information
    const history = rentalHistory.map(item => ({
      id: item.id,
      rental_id: item.rentalId,
      rental_number: item.rental?.rentalNumber || null,
      customer_name: item.rental?.customer?.name || null,
      customer_email: item.rental?.customer?.email || null,
      customer_phone: item.rental?.customer?.phone || null,
      project_id: item.projectId,
      project_name: item.project?.name || null,
      project_description: item.project?.description || null,
      project_status: item.project?.status || null,
      employee_id: item.employeeId,
      employee_name: item.employee ? `${item.employee.firstName} ${item.employee.lastName}` : null,
      employee_id_number: item.employee?.fileNumber || null,
      employee_email: item.employee?.email || null,
      employee_phone: item.employee?.phone || null,
      assignment_type: item.assignmentType,
      equipment_name: equipmentData[0].name,
      quantity: 1, // Default to 1 for manual/project assignments
      unit_price: item.dailyRate || 0,
      total_price: item.totalAmount || 0,
      rate_type: 'daily', // Default for manual/project assignments
      status: item.status,
      notes: item.notes,
      rental_start_date: item.startDate,
      rental_expected_end_date: item.endDate,
      rental_actual_end_date: item.endDate,
      rental_status: item.status,
      created_at: item.createdAt,
      updated_at: item.updatedAt
    }));

    // Also fetch traditional rental items for backward compatibility
    const rentalItems = await db
      .select({
        id: rentals.id,
        rentalNumber: rentals.rentalNumber,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone
        },
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status
        },
        startDate: rentals.startDate,
        expectedEndDate: rentals.expectedEndDate,
        actualEndDate: rentals.actualEndDate,
        status: rentals.status,
        notes: rentals.notes,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt
      })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(projects, eq(rentals.projectId, projects.id))
      .where(eq(rentals.equipmentId, id))
      .orderBy(desc(rentals.createdAt));

         // Transform rental items data
     const rentalItemsHistory = rentalItems.map(item => ({
       id: `rental_item_${item.id}`,
       rental_id: item.id,
       rental_number: item.rentalNumber,
       customer_name: item.customer?.name || 'Unknown',
       customer_email: item.customer?.email,
       customer_phone: item.customer?.phone,
       project_id: item.projectId,
       project_name: item.project?.name || null,
       project_description: item.project?.description || null,
       project_status: item.project?.status || null,
       employee_id: null,
       employee_name: null,
       employee_id_number: null,
       employee_email: null,
       employee_phone: null,
       assignment_type: 'rental',
       equipment_name: equipmentData[0].name,
       quantity: 1, // Default to 1 for rental items
       unit_price: 0, // No direct unit price in this query
       total_price: 0, // No direct total price in this query
       rate_type: 'daily', // Default for rental items
       days: null, // No direct days in this query
       status: item.status,
       notes: item.notes,
       rental_start_date: item.startDate,
       rental_expected_end_date: item.expectedEndDate,
       rental_actual_end_date: item.actualEndDate,
       rental_status: item.status,
       created_at: item.createdAt,
       updated_at: item.updatedAt
     }));

    // Combine both histories and sort by creation date
    const combinedHistory = [...history, ...rentalItemsHistory].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({
      success: true,
      data: combinedHistory,
      count: combinedHistory.length
    });
  } catch (error) {
    console.error('Error fetching equipment rental history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rental history' },
      { status: 500 }
    );
  }
} 

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid equipment ID' },
        { status: 400 }
      );
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
      status = 'active'
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
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

         // Create the rental history entry
     const [createdRentalHistory] = await db.insert(equipmentRentalHistory).values({
       equipmentId: id,
       rentalId: assignment_type === 'rental' ? body.rental_id : null,
       projectId: assignment_type === 'project' ? project_id : null,
       employeeId: assignment_type === 'manual' ? employee_id : null,
       assignmentType: assignment_type,
       startDate: new Date(start_date),
       endDate: end_date ? new Date(end_date) : null,
       status,
       notes,
       dailyRate: daily_rate ? parseFloat(daily_rate) : null,
       totalAmount: total_amount ? parseFloat(total_amount) : null
     }).returning();

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
             phone: customers.phone
           }
         },
         project: {
           id: projects.id,
           name: projects.name,
           description: projects.description,
           status: projects.status
         },
         employee: {
           id: employees.id,
           firstName: employees.firstName,
           lastName: employees.lastName,
           fileNumber: employees.fileNumber,
           email: employees.email,
           phone: employees.phone
         }
       })
       .from(equipmentRentalHistory)
       .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
       .leftJoin(customers, eq(rentals.customerId, customers.id))
       .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
       .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
       .where(eq(equipmentRentalHistory.id, createdRentalHistory.id))
       .limit(1);

    // If this is a manual assignment with an employee, also create an employee assignment
    let employeeAssignment = null;
    if (assignment_type === 'manual' && employee_id) {
      try {
        employeeAssignment = await db.insert(employeeAssignments).values({
          employeeId: parseInt(employee_id),
          name: `Equipment Assignment - ${equipmentData[0].name}`,
          type: 'manual',
          location: body.location || null,
          startDate: new Date(start_date),
          endDate: end_date ? new Date(end_date) : null,
          status: 'active',
          notes: `Manual equipment assignment: ${notes || 'No additional notes'}`,
          projectId: null,
          rentalId: null
        }).returning();

        console.log('Employee assignment created automatically:', employeeAssignment);
      } catch (assignmentError) {
        console.error('Error creating employee assignment:', assignmentError);
        // Don't fail the equipment assignment if employee assignment creation fails
      }
    }

         return NextResponse.json({
       success: true,
       data: {
         rentalHistory: rentalHistory[0],
         employeeAssignment: employeeAssignment?.[0] || null
       },
       message: 'Equipment assignment created successfully' + (employeeAssignment ? ' and employee assignment created automatically' : '')
     }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create equipment assignment' },
      { status: 500 }
    );
  }
} 