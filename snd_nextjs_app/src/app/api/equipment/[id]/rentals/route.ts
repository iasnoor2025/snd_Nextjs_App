import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const equipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Fetch rental history for this equipment from the new EquipmentRentalHistory table
    const rentalHistory = await prisma.equipmentRentalHistory.findMany({
      where: {
        equipment_id: id
      },
      include: {
        rental: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        },
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform the data to include more useful information
    const history = rentalHistory.map(item => ({
      id: item.id,
      rental_id: item.rental_id,
      rental_number: item.rental?.rental_number || null,
      customer_name: item.rental?.customer?.name || null,
      customer_email: item.rental?.customer?.email || null,
      customer_phone: item.rental?.customer?.phone || null,
      project_id: item.project_id,
      project_name: item.project?.name || null,
      project_description: item.project?.description || null,
      project_status: item.project?.status || null,
      employee_id: item.employee_id,
      employee_name: item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : null,
      employee_id_number: item.employee?.employee_id || null,
      employee_email: item.employee?.email || null,
      employee_phone: item.employee?.phone || null,
      assignment_type: item.assignment_type,
      equipment_name: equipment.name,
      quantity: 1, // Default to 1 for manual/project assignments
      unit_price: item.daily_rate || 0,
      total_price: item.total_amount || 0,
      rate_type: 'daily', // Default for manual/project assignments
      status: item.status,
      notes: item.notes,
      rental_start_date: item.start_date,
      rental_expected_end_date: item.end_date,
      rental_actual_end_date: item.end_date,
      rental_status: item.status,
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    // Also fetch traditional rental items for backward compatibility
    const rentalItems = await prisma.rentalItem.findMany({
      where: {
        equipment_id: id
      },
      include: {
        rental: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            },
            project: {
              select: {
                id: true,
                name: true,
                description: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    // Transform rental items data
    const rentalItemsHistory = rentalItems.map(item => ({
      id: `rental_item_${item.id}`,
      rental_id: item.rental_id,
      rental_number: item.rental.rental_number,
      customer_name: item.rental.customer?.name || 'Unknown',
      customer_email: item.rental.customer?.email,
      customer_phone: item.rental.customer?.phone,
      project_id: item.rental.project_id,
      project_name: item.rental.project?.name || null,
      project_description: item.rental.project?.description || null,
      project_status: item.rental.project?.status || null,
      employee_id: null,
      employee_name: null,
      employee_id_number: null,
      employee_email: null,
      employee_phone: null,
      assignment_type: 'rental',
      equipment_name: item.equipment_name,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
      rate_type: item.rate_type,
      days: item.days,
      status: item.status,
      notes: item.notes,
      rental_start_date: item.rental.start_date,
      rental_expected_end_date: item.rental.expected_end_date,
      rental_actual_end_date: item.rental.actual_end_date,
      rental_status: item.rental.status,
      created_at: item.created_at,
      updated_at: item.updated_at
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
    const equipment = await prisma.equipment.findUnique({
      where: { id }
    });

    if (!equipment) {
      return NextResponse.json(
        { success: false, error: 'Equipment not found' },
        { status: 404 }
      );
    }

    // Create the rental history entry
    const rentalHistory = await prisma.equipmentRentalHistory.create({
      data: {
        equipment_id: id,
        rental_id: assignment_type === 'rental' ? body.rental_id : null,
        project_id: assignment_type === 'project' ? project_id : null,
        employee_id: assignment_type === 'manual' ? employee_id : null,
        assignment_type,
        start_date: new Date(start_date),
        end_date: end_date ? new Date(end_date) : null,
        status,
        notes,
        daily_rate: daily_rate ? parseFloat(daily_rate) : null,
        total_amount: total_amount ? parseFloat(total_amount) : null
      },
      include: {
        rental: {
          include: {
            customer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true
              }
            }
          }
        },
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true
          }
        },
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            employee_id: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: rentalHistory,
      message: 'Equipment assignment created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment assignment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create equipment assignment' },
      { status: 500 }
    );
  }
} 