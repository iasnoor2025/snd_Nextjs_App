import { db } from '@/lib/db';
import {
  employees,
  equipmentRentalHistory,
  equipment as equipmentTable,
  projects,
  rentals,
} from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission, withReadPermission } from '@/lib/rbac/api-middleware';
import { asc, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const GET = withReadPermission(async (_request: NextRequest) => {
  try {

    const equipment = await db
      .select({
        id: equipmentTable.id,
        name: equipmentTable.name,
        model_number: equipmentTable.modelNumber,
        status: equipmentTable.status,
        category_id: equipmentTable.categoryId,
        manufacturer: equipmentTable.manufacturer,
        daily_rate: equipmentTable.dailyRate,
        weekly_rate: equipmentTable.weeklyRate,
        monthly_rate: equipmentTable.monthlyRate,
        erpnext_id: equipmentTable.erpnextId,
        istimara: equipmentTable.istimara,
        istimara_expiry_date: equipmentTable.istimaraExpiryDate,
        serial_number: equipmentTable.serialNumber,
        description: equipmentTable.description,
      })
      .from(equipmentTable)
      .orderBy(asc(equipmentTable.name));

    // Get current active assignments for equipment
    
    let currentAssignments: any[] = [];

    try {
      // Get all active assignments with related data
      currentAssignments = await db
        .select({
          equipment_id: equipmentRentalHistory.equipmentId,
          id: equipmentRentalHistory.id,
          assignment_type: equipmentRentalHistory.assignmentType,
          status: equipmentRentalHistory.status,
          project_id: equipmentRentalHistory.projectId,
          rental_id: equipmentRentalHistory.rentalId,
          employee_id: equipmentRentalHistory.employeeId,
          start_date: equipmentRentalHistory.startDate,
          end_date: equipmentRentalHistory.endDate,
          notes: equipmentRentalHistory.notes,
        })
        .from(equipmentRentalHistory)
        .where(eq(equipmentRentalHistory.status, 'active'));

      // Fetch additional details for projects, rentals, and employees if needed
      if (currentAssignments.length > 0) {
        const projectIds = currentAssignments.filter(a => a.project_id).map(a => a.project_id);
        const rentalIds = currentAssignments.filter(a => a.rental_id).map(a => a.rental_id);
        const employeeIds = currentAssignments.filter(a => a.employee_id).map(a => a.employee_id);

        // Fetch project names
        if (projectIds.length > 0) {
          try {
            const projectNames = await db
              .select({ id: projects.id, name: projects.name })
              .from(projects)
              .where(inArray(projects.id, projectIds));

            const projectMap = new Map(projectNames.map(p => [p.id, p.name]));
            currentAssignments.forEach(assignment => {
              if (assignment.project_id) {
                assignment.project_name = projectMap.get(assignment.project_id);
              }
            });
          } catch (error) {
            
          }
        }

        // Fetch rental information
        if (rentalIds.length > 0) {
          try {
            const rentalInfo = await db
              .select({
                id: rentals.id,
                rental_number: rentals.rentalNumber,
                project_id: rentals.projectId,
              })
              .from(rentals)
              .where(inArray(rentals.id, rentalIds));

            const rentalMap = new Map(rentalInfo.map(r => [r.id, r]));
            currentAssignments.forEach(assignment => {
              if (assignment.rental_id) {
                assignment.rental_info = rentalMap.get(assignment.rental_id);
              }
            });
          } catch (error) {
            
          }
        }

        // Fetch employee names
        if (employeeIds.length > 0) {
          try {
            const employeeNames = await db
              .select({
                id: employees.id,
                firstName: employees.firstName,
                lastName: employees.lastName,
                fileNumber: employees.fileNumber,
              })
              .from(employees)
              .where(inArray(employees.id, employeeIds));

            const employeeMap = new Map(employeeNames.map(e => [e.id, e]));
            currentAssignments.forEach(assignment => {
              if (assignment.employee_id) {
                assignment.employee_info = employeeMap.get(assignment.employee_id);
              }
            });
          } catch (error) {
            
          }
        }
      }
    } catch (error) {
      
      currentAssignments = [];
    }

    // Create a map of equipment_id to assignment info
    const assignmentMap = new Map();
    currentAssignments.forEach(assignment => {
      assignmentMap.set(assignment.equipment_id, assignment);
    });

    // Add assignment info to equipment
    const equipmentWithAssignments = equipment.map(item => {
      const assignment = assignmentMap.get(item.id);

      let assignmentName = '';
      let assignmentDetails: any = null;

      if (assignment) {
        // Create meaningful assignment name
        if (assignment.assignment_type === 'project' && assignment.project_id) {
          assignmentName = `Project Assignment ${assignment.id}`;
        } else if (assignment.assignment_type === 'rental' && assignment.rental_id) {
          assignmentName = `Rental Assignment ${assignment.id}`;
        } else if (assignment.assignment_type === 'manual' && assignment.employee_id) {
          assignmentName = `Employee Assignment ${assignment.id}`;
        } else {
          assignmentName = `${assignment.assignment_type} Assignment ${assignment.id}`;
        }

        assignmentDetails = {
          id: assignment.id,
          type: assignment.assignment_type,
          name: assignmentName,
          status: assignment.status,
          notes: assignment.notes,
          start_date: assignment.start_date,
          end_date: assignment.end_date,
          location: null, // Will be populated if needed
          project: assignment.project_id
            ? {
                id: assignment.project_id,
                name: assignment.project_name || `Project ${assignment.project_id}`,
                location: null,
              }
            : null,
          rental: assignment.rental_id
            ? {
                id: assignment.rental_id,
                rental_number:
                  assignment.rental_info?.rental_number || `Rental ${assignment.rental_id}`,
                project: assignment.rental_info?.project_id
                  ? {
                      id: assignment.rental_info.project_id,
                      name:
                        assignment.project_name || `Project ${assignment.rental_info.project_id}`,
                    }
                  : null,
              }
            : null,
          employee: assignment.employee_id
            ? {
                id: assignment.employee_id,
                name: assignment.employee_info?.name || `Employee ${assignment.employee_id}`,
                file_number:
                  assignment.employee_info?.file_number || `EMP${assignment.employee_id}`,
                full_name: assignment.employee_info?.name || `Employee ${assignment.employee_id}`,
              }
            : null,
        };
      }

      // Determine the effective status - prioritize assignment status over equipment status
      let effectiveStatus = item.status;
      if (assignment && assignment.status === 'active') {
        effectiveStatus = 'assigned';
      } else if (assignment && assignment.status === 'completed') {
        effectiveStatus = 'available';
      } else if (!assignment) {
        // If no assignment exists, force status to 'available'
        effectiveStatus = 'available';
      }

      return {
        ...item,
        status: effectiveStatus,
        current_assignment: assignmentDetails,
      };
    });

    return NextResponse.json({
      success: true,
      data: equipmentWithAssignments,
      source: 'local',
      count: equipmentWithAssignments.length,
    });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.equipment.read);

export const POST = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();

    const inserted = await db
      .insert(equipmentTable)
      .values({
        name: body.name,
        description: body.description ?? null,
        categoryId: body.categoryId ?? null,
        manufacturer: body.manufacturer ?? null,
        modelNumber: body.modelNumber ?? null,
        serialNumber: body.serialNumber ?? null,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate).toISOString() : null,
        purchasePrice: body.purchasePrice ? String(parseFloat(body.purchasePrice)) : null,
        status: body.status || 'available',
        dailyRate: body.dailyRate ? String(parseFloat(body.dailyRate)) : null,
        weeklyRate: body.weeklyRate ? String(parseFloat(body.weeklyRate)) : null,
        monthlyRate: body.monthlyRate ? String(parseFloat(body.monthlyRate)) : null,
        istimara: body.istimara ?? null,
        istimaraExpiryDate: body.istimara_expiry_date
          ? new Date(body.istimara_expiry_date).toISOString()
          : null,
        isActive: true as any,
        updatedAt: new Date().toISOString(),
      })
      .returning();
    const equipment = inserted[0];

    return NextResponse.json({ success: true, data: equipment }, { status: 201 });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create equipment',
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.equipment.create);

export const PUT = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      categoryId,
      manufacturer,
      modelNumber,
      serialNumber,
      purchaseDate,
      purchasePrice,
      status,
      locationId,
      notes,
      dailyRate,
      weeklyRate,
      monthlyRate,
      istimara,
      istimara_expiry_date,
    } = body;

    const updated = await db
      .update(equipmentTable)
      .set({
        name,
        description: description ?? null,
        categoryId,
        manufacturer,
        modelNumber,
        serialNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        purchasePrice: purchasePrice ? String(parseFloat(purchasePrice)) : null,
        status,
        locationId,
        notes,
        dailyRate: dailyRate ? String(parseFloat(dailyRate)) : null,
        weeklyRate: weeklyRate ? String(parseFloat(weeklyRate)) : null,
        monthlyRate: monthlyRate ? String(parseFloat(monthlyRate)) : null,
        istimara: istimara ?? null,
        istimaraExpiryDate: istimara_expiry_date
          ? new Date(istimara_expiry_date).toISOString()
          : null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(equipmentTable.id, id))
      .returning();
    const equipment = updated[0];

    return NextResponse.json({ success: true, data: equipment });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update equipment',
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.equipment.update);

export const DELETE = withPermission(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id } = body;

    await db.delete(equipmentTable).where(eq(equipmentTable.id, id));

    return NextResponse.json({ success: true, message: 'Equipment deleted successfully' });
  } catch (error) {
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete equipment',
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.equipment.delete);
