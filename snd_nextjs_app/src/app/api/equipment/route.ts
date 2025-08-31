import { db } from '@/lib/drizzle';
import {
  employees,
  equipmentRentalHistory,
  equipment as equipmentTable,
  projects,
  rentals,
} from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { asc, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';
import { autoExtractDoorNumber } from '@/lib/utils/equipment-utils';

// GET /api/equipment - List equipment with assignments
const getEquipmentHandler = async (_request: NextRequest) => {
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
          prefix: 'equipment',
          tags: [CACHE_TAGS.EQUIPMENT, CACHE_TAGS.LIST]
        }
      );
    } catch (error) {
      console.error('Cache error:', error);
      
      // Fallback to direct database query
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

      return NextResponse.json({
        success: true,
        data: equipment.map(item => ({
          ...item,
          assignments: [],
          is_assigned: false,
          current_assignment: null,
        })),
        total: equipment.length,
      });
    }
  } catch (error) {
    console.error('Error fetching equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch equipment',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};

// POST /api/equipment - Create new equipment
const createEquipmentHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
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

    // Auto-extract door number from equipment name if not provided
    const finalDoorNumber = autoExtractDoorNumber(name, doorNumber);

    const [inserted] = await db
      .insert(equipmentTable)
      .values({
        name,
        description: description ?? null,
        categoryId,
        manufacturer,
        modelNumber,
        serialNumber,
        doorNumber: finalDoorNumber,
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const equipment = inserted[0];

    return NextResponse.json({ 
      success: true, 
      data: equipment,
      doorNumberExtracted: finalDoorNumber !== doorNumber,
      extractedDoorNumber: finalDoorNumber
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create equipment',
      },
      { status: 500 }
    );
  }
};

// PUT /api/equipment - Update equipment
const updateEquipmentHandler = async (request: NextRequest) => {
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

    // Auto-extract door number from equipment name if not provided
    const finalDoorNumber = autoExtractDoorNumber(name, doorNumber);

    const updated = await db
      .update(equipmentTable)
      .set({
        name,
        description: description ?? null,
        categoryId,
        manufacturer,
        modelNumber,
        serialNumber,
        doorNumber: finalDoorNumber,
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

    return NextResponse.json({ 
      success: true, 
      data: equipment,
      doorNumberExtracted: finalDoorNumber !== doorNumber,
      extractedDoorNumber: finalDoorNumber
    });
  } catch (error) {
    console.error('Error updating equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update equipment',
      },
      { status: 500 }
    );
  }
};

// DELETE /api/equipment - Delete equipment
const deleteEquipmentHandler = async (request: NextRequest) => {
  try {
    const body = await request.json();
    const { id } = body;

    await db.delete(equipmentTable).where(eq(equipmentTable.id, id));

    return NextResponse.json({ success: true, message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('Error deleting equipment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete equipment',
      },
      { status: 500 }
    );
  }
};

export const GET = withPermission(PermissionConfigs.equipment.read)(getEquipmentHandler);
export const POST = withPermission(PermissionConfigs.equipment.create)(createEquipmentHandler);
export const PUT = withPermission(PermissionConfigs.equipment.update)(updateEquipmentHandler);
export const DELETE = withPermission(PermissionConfigs.equipment.delete)(deleteEquipmentHandler);
