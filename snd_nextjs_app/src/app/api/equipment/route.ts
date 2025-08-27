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
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

export const GET = withReadPermission(async (_request: NextRequest) => {
  try {
    // Generate cache key for equipment list
    const cacheKey = generateCacheKey('equipment', 'list', {});
    
    try {
      return await cacheQueryResult(
        cacheKey,
        async () => {
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
              door_number: equipmentTable.doorNumber,
            })
            .from(equipmentTable)
            .orderBy(asc(equipmentTable.name));

          // Get current active assignments for equipment
          
          let currentAssignments: any[] = [];

          try {
            // Get all active assignments with related data
            currentAssignments = await db
              .select({
                equipment_id: equipmentTable.id,
                employee_id: employees.id,
                employee_name: employees.firstName,
                employee_last_name: employees.lastName,
                project_id: projects.id,
                project_name: projects.name,
                rental_id: rentals.id,
                rental_number: rentals.rentalNumber,
                assignment_date: equipmentRentalHistory.assignmentDate,
                return_date: equipmentRentalHistory.returnDate,
                status: equipmentRentalHistory.status,
              })
              .from(equipmentTable)
              .leftJoin(equipmentRentalHistory, eq(equipmentTable.id, equipmentRentalHistory.equipmentId))
              .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
              .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
              .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
              .where(eq(equipmentRentalHistory.status, 'active'));

            // Group assignments by equipment
            const assignmentsByEquipment = currentAssignments.reduce((acc, assignment) => {
              const equipmentId = assignment.equipment_id;
              if (!acc[equipmentId]) {
                acc[equipmentId] = [];
              }
              acc[equipmentId].push(assignment);
              return acc;
            }, {} as Record<number, any[]>);

            // Merge equipment data with assignments
            const equipmentWithAssignments = equipment.map((item) => {
              const assignments = assignmentsByEquipment[item.id] || [];
              return {
                ...item,
                assignments,
                is_assigned: assignments.length > 0,
                current_assignment: assignments[0] || null,
              };
            });

            return NextResponse.json({
              success: true,
              data: equipmentWithAssignments,
              total: equipmentWithAssignments.length,
            });
          } catch (error) {
            console.error('Error fetching equipment assignments:', error);
            
            // Return equipment without assignments if there's an error
            const equipmentWithAssignments = equipment.map((item) => ({
              ...item,
              assignments: [],
              is_assigned: false,
              current_assignment: null,
            }));

            return NextResponse.json({
              success: true,
              data: equipmentWithAssignments,
              total: equipmentWithAssignments.length,
            });
          }
        },
        {
          ttl: 300, // 5 minutes
          tags: [CACHE_TAGS.EQUIPMENT, CACHE_TAGS.EMPLOYEES, CACHE_TAGS.PROJECTS, CACHE_TAGS.RENTALS],
        }
      );
    } catch (cacheError) {
      console.error('Cache error, falling back to direct database query:', cacheError);
      console.error('Cache error details:', {
        message: cacheError instanceof Error ? cacheError.message : 'Unknown cache error',
        stack: cacheError instanceof Error ? cacheError.stack : undefined,
        name: cacheError instanceof Error ? cacheError.name : 'Unknown'
      });
      
      // Fallback: direct database query without cache
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

      // Return equipment without assignments as fallback
      const equipmentWithAssignments = equipment.map((item) => ({
        ...item,
        assignments: [],
        is_assigned: false,
        current_assignment: null,
      }));

      return NextResponse.json({
        success: true,
        data: equipmentWithAssignments,
        total: equipmentWithAssignments.length,
      });
    }
  } catch (error) {
    console.error('Error fetching equipment:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({ 
      error: 'Failed to fetch equipment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

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
        doorNumber: body.doorNumber ?? null,
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
      doorNumber,
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
        doorNumber,
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
