import { db } from '@/lib/drizzle';
import {
  employees,
  equipmentRentalHistory,
  equipment as equipmentTable,
  equipmentMaintenance,
  equipmentDocuments,
  projects,
  projectEquipment,
  projectManpower,
  rentals,
  rentalItems,
  customers,
} from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { asc, eq, or, ilike, sql, desc, and, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { NextRequest, NextResponse } from 'next/server';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';
import { autoExtractDoorNumber } from '@/lib/utils/equipment-utils';

// GET /api/equipment - List equipment with assignments
const getEquipmentHandler = async (request: NextRequest) => {
  try {
    // Extract pagination and filtering parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '1000'); // Increase default limit to show all equipment
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const type = url.searchParams.get('type') || '';
    const category = url.searchParams.get('category') || '';
    
    const offset = (page - 1) * limit;
    
    // Generate cache key for equipment list with parameters
    const cacheKey = generateCacheKey('equipment', 'list', { page, limit, search, status, type, category });
    
    try {
      return await cacheQueryResult(
        cacheKey,
        async () => {
          // Build base query
          let equipmentQuery = db
            .select({
              id: equipmentTable.id,
              name: equipmentTable.name,
              model_number: equipmentTable.modelNumber,
              category_id: equipmentTable.categoryId,
              manufacturer: equipmentTable.manufacturer,
              daily_rate: equipmentTable.dailyRate,
              weekly_rate: equipmentTable.weeklyRate,
              monthly_rate: equipmentTable.monthlyRate,
              erpnext_id: equipmentTable.erpnextId,
              istimara: equipmentTable.istimara,
              istimara_expiry_date: equipmentTable.istimaraExpiryDate,
              insurance: equipmentTable.insurance,
              insurance_expiry_date: equipmentTable.insuranceExpiryDate,
              tuv_card: equipmentTable.tuvCard,
              tuv_card_expiry_date: equipmentTable.tuvCardExpiryDate,
              gps_install_date: equipmentTable.gpsInstallDate,
              gps_expiry_date: equipmentTable.gpsExpiryDate,
              periodic_examination_date: equipmentTable.periodicExaminationDate,
              periodic_examination_expiry_date: equipmentTable.periodicExaminationExpiryDate,
              serial_number: equipmentTable.serialNumber,
              chassis_number: equipmentTable.chassisNumber,
              description: equipmentTable.description,
              door_number: equipmentTable.doorNumber,
              assigned_to: equipmentTable.assignedTo,
              status: equipmentTable.status, // Include status field from database
            })
            .from(equipmentTable);

          // Add search filter if provided
          if (search) {
            equipmentQuery = equipmentQuery.where(
              or(
                ilike(equipmentTable.name, `%${search}%`),
                ilike(equipmentTable.manufacturer, `%${search}%`),
                ilike(equipmentTable.serialNumber, `%${search}%`)
              )
            );
          }

          // Add status filter if provided
          if (status) {
            equipmentQuery = equipmentQuery.where(eq(equipmentTable.status, status));
          }

          // Note: Type filtering is handled on frontend via category_id

          // Add category filter if provided
          if (category) {
            equipmentQuery = equipmentQuery.where(eq(equipmentTable.categoryId, parseInt(category)));
          }

          // Apply pagination and get results
          const equipment = await equipmentQuery
            .orderBy(asc(equipmentTable.name))
            .limit(limit)
            .offset(offset);

          // Get total count for pagination
          let countQuery = db
            .select({ count: sql<number>`count(*)` })
            .from(equipmentTable);

          if (search) {
            countQuery = countQuery.where(
              or(
                ilike(equipmentTable.name, `%${search}%`),
                ilike(equipmentTable.manufacturer, `%${search}%`),
                ilike(equipmentTable.serialNumber, `%${search}%`)
              )
            );
          }

          if (status) {
            countQuery = countQuery.where(eq(equipmentTable.status, status));
          }

          const [totalResult] = await countQuery;
          const total = Number(totalResult?.count || 0);

          // Get current active assignments for equipment
          let currentAssignments: any[] = [];

          try {
            // Get equipment IDs for filtering assignments
            const equipmentIds = equipment.map(e => e.id);
            
            if (equipmentIds.length === 0) {
              // No equipment, return empty arrays
              return NextResponse.json({
                success: true,
                data: [],
                total: 0,
                page,
                limit,
                totalPages: 0,
                hasNextPage: false,
                hasPrevPage: false,
              });
            }

            // Optimized: Fetch assignments and maintenance in parallel, filtered by equipment IDs
            // Create aliases for employees to handle both rentalItems operator and equipmentRentalHistory employee
            const rentalOperator = alias(employees, 'rental_operator');
            const rentalHistoryEmployee = alias(employees, 'rental_history_employee');
            
            const [rawRentalAssignments, rawProjectAssignments, maintenanceRecords] = await Promise.all([
              // Get active assignments from equipmentRentalHistory with related data (filtered by equipment IDs)
              // Also join with rentalItems to get operator information
              db
                .select({
                  equipment_id: equipmentRentalHistory.equipmentId,
                  assignment_id: equipmentRentalHistory.id,
                  // Prefer operator from rentalItems, fallback to employeeId from equipmentRentalHistory
                  employee_id: sql<number | null>`COALESCE(${rentalItems.operatorId}, ${equipmentRentalHistory.employeeId})`.as('employee_id'),
                  employee_first_name: sql<string | null>`COALESCE(${rentalOperator.firstName}, ${rentalHistoryEmployee.firstName})`.as('employee_first_name'),
                  employee_last_name: sql<string | null>`COALESCE(${rentalOperator.lastName}, ${rentalHistoryEmployee.lastName})`.as('employee_last_name'),
                  employee_file_number: sql<string | null>`COALESCE(${rentalOperator.fileNumber}, ${rentalHistoryEmployee.fileNumber})`.as('employee_file_number'),
                  project_id: projects.id,
                  project_name: projects.name,
                  rental_id: rentals.id,
                  rental_number: rentals.rentalNumber,
                  rental_customer_id: rentals.customerId,
                  rental_customer_name: customers.name,
                  assignment_type: equipmentRentalHistory.assignmentType,
                  assignment_date: equipmentRentalHistory.startDate,
                  return_date: equipmentRentalHistory.endDate,
                  assignment_status: equipmentRentalHistory.status,
                  notes: equipmentRentalHistory.notes,
                })
                .from(equipmentRentalHistory)
                .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
                .leftJoin(rentalItems, and(
                  eq(rentalItems.rentalId, rentals.id),
                  eq(rentalItems.equipmentId, equipmentRentalHistory.equipmentId),
                  eq(rentalItems.status, 'active')
                ))
                .leftJoin(rentalOperator, eq(rentalItems.operatorId, rentalOperator.id))
                .leftJoin(rentalHistoryEmployee, eq(equipmentRentalHistory.employeeId, rentalHistoryEmployee.id))
                .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
                .leftJoin(customers, eq(rentals.customerId, customers.id))
                .where(
                  and(
                    inArray(equipmentRentalHistory.equipmentId, equipmentIds),
                    eq(equipmentRentalHistory.status, 'active')
                  )
                ),
              // Get active assignments from projectEquipment (filtered by equipment IDs)
              db
                .select({
                  equipment_id: projectEquipment.equipmentId,
                  assignment_id: projectEquipment.id,
                  project_id: projectEquipment.projectId,
                  project_name: projects.name,
                  project_customer_id: projects.customerId,
                  project_customer_name: customers.name,
                  operator_id: projectManpower.employeeId,
                  operator_first_name: employees.firstName,
                  operator_last_name: employees.lastName,
                  operator_file_number: employees.fileNumber,
                  operator_worker_name: projectManpower.workerName,
                  assignment_type: sql<string>`'project'`,
                  assignment_date: projectEquipment.startDate,
                  return_date: projectEquipment.endDate,
                  assignment_status: projectEquipment.status,
                  notes: projectEquipment.notes,
                })
                .from(projectEquipment)
                .leftJoin(projects, eq(projectEquipment.projectId, projects.id))
                .leftJoin(customers, eq(projects.customerId, customers.id))
                .leftJoin(projectManpower, eq(projectEquipment.operatorId, projectManpower.id))
                .leftJoin(employees, eq(projectManpower.employeeId, employees.id))
                .where(
                  and(
                    inArray(projectEquipment.equipmentId, equipmentIds),
                    sql`${projectEquipment.status} IN ('active', 'pending')`,
                    sql`${projectEquipment.startDate} <= CURRENT_DATE`,
                    or(
                      sql`${projectEquipment.endDate} IS NULL`,
                      sql`${projectEquipment.endDate} >= CURRENT_DATE`
                    )
                  )
                ),
              // Get active maintenance records (filtered by equipment IDs)
              db
                .select({
                  equipment_id: equipmentMaintenance.equipmentId,
                  maintenance_id: equipmentMaintenance.id,
                  maintenance_status: equipmentMaintenance.status,
                  maintenance_title: equipmentMaintenance.title,
                  maintenance_type: equipmentMaintenance.type,
                  scheduled_date: equipmentMaintenance.scheduledDate,
                  due_date: equipmentMaintenance.dueDate,
                  started_at: equipmentMaintenance.startedAt,
                  completed_at: equipmentMaintenance.completedAt,
                })
                .from(equipmentMaintenance)
                .where(
                  and(
                    inArray(equipmentMaintenance.equipmentId, equipmentIds),
                    eq(equipmentMaintenance.status, 'open')
                  )
                )
            ]);

            // Combine both types of assignments
            const rawAssignments = [...rawRentalAssignments, ...rawProjectAssignments];

            // Transform the flat data to nested objects expected by frontend
            currentAssignments = rawAssignments.map(assignment => {
              const assignmentAny = assignment as any;
              
              // Determine employee/operator information
              // For rental assignments: use employee_id directly
              // For project assignments: use operator_id (from projectManpower.employeeId) or operator_worker_name
              let employeeInfo = null;
              if (assignmentAny.employee_id) {
                // Rental assignment - direct employee
                employeeInfo = {
                  id: assignmentAny.employee_id,
                  full_name: [assignmentAny.employee_first_name, assignmentAny.employee_last_name].filter(Boolean).join(' '),
                  first_name: assignmentAny.employee_first_name,
                  last_name: assignmentAny.employee_last_name,
                  file_number: assignmentAny.employee_file_number,
                };
              } else if (assignmentAny.operator_id) {
                // Project assignment - operator from projectManpower (employee)
                employeeInfo = {
                  id: assignmentAny.operator_id,
                  full_name: [assignmentAny.operator_first_name, assignmentAny.operator_last_name].filter(Boolean).join(' '),
                  first_name: assignmentAny.operator_first_name,
                  last_name: assignmentAny.operator_last_name,
                  file_number: assignmentAny.operator_file_number,
                };
              } else if (assignmentAny.operator_worker_name) {
                // Project assignment - operator is a worker (not an employee)
                employeeInfo = {
                  id: null,
                  full_name: assignmentAny.operator_worker_name,
                  first_name: assignmentAny.operator_worker_name,
                  last_name: null,
                  file_number: null,
                };
              }
              
              return {
                equipment_id: assignment.equipment_id,
                assignment_id: assignment.assignment_id,
                employee: employeeInfo,
                project: assignmentAny.project_id ? {
                  id: assignmentAny.project_id,
                  name: assignmentAny.project_name,
                  customer_id: assignmentAny.project_customer_id,
                  customer_name: assignmentAny.project_customer_name,
                } : null,
                rental: assignmentAny.rental_id ? {
                  id: assignmentAny.rental_id,
                  rental_number: assignmentAny.rental_number,
                  customer_id: assignmentAny.rental_customer_id,
                  customer_name: assignmentAny.rental_customer_name,
                } : null,
                type: assignment.assignment_type,
                assignment_date: assignment.assignment_date,
                return_date: assignment.return_date,
                status: assignment.assignment_status,
                notes: assignment.notes,
              };
            });

            // Group assignments by equipment
            const assignmentsByEquipment = currentAssignments.reduce((acc, assignment) => {
              const equipmentId = assignment.equipment_id;
              if (!acc[equipmentId]) {
                acc[equipmentId] = [];
              }
              acc[equipmentId].push(assignment);
              return acc;
            }, {} as Record<number, any[]>);

            // Group maintenance records by equipment
            const maintenanceByEquipment = maintenanceRecords.reduce((acc, maintenance) => {
              const equipmentId = maintenance.equipment_id;
              if (!acc[equipmentId]) {
                acc[equipmentId] = [];
              }
              acc[equipmentId].push(maintenance);
              return acc;
            }, {} as Record<number, any[]>);

            // Fetch equipment images/photos from documents
            const equipmentImages: Record<number, { url: string | null; isCard: boolean }> = {};
            
            if (equipmentIds.length > 0) {
              // Fetch images/photos for each equipment, prioritizing photos
              const imageDocuments = await db
                .select({
                  equipmentId: equipmentDocuments.equipmentId,
                  filePath: equipmentDocuments.filePath,
                  mimeType: equipmentDocuments.mimeType,
                  documentType: equipmentDocuments.documentType,
                  fileName: equipmentDocuments.fileName,
                  createdAt: equipmentDocuments.createdAt,
                })
                .from(equipmentDocuments)
                .where(
                  and(
                    inArray(equipmentDocuments.equipmentId, equipmentIds),
                    or(
                      ilike(equipmentDocuments.mimeType, 'image/%'),
                      ilike(equipmentDocuments.documentType, '%photo%'),
                      ilike(equipmentDocuments.documentType, '%picture%'),
                      ilike(equipmentDocuments.documentType, '%image%')
                    )
                  )
                )
                .orderBy(desc(equipmentDocuments.createdAt));

              // Sort documents: prioritize photos over istimara, then by newest first
              const sortedDocs = imageDocuments.sort((a, b) => {
                const aType = (a.documentType || '').toLowerCase();
                const bType = (b.documentType || '').toLowerCase();
                const aName = (a.fileName || '').toLowerCase();
                const bName = (b.fileName || '').toLowerCase();
                
                const aIsPhoto = aType.includes('photo') || aName.includes('photo');
                const bIsPhoto = bType.includes('photo') || bName.includes('photo');
                
                // Photos come first
                if (aIsPhoto && !bIsPhoto) return -1;
                if (!aIsPhoto && bIsPhoto) return 1;
                
                // If both are photos or both are documents, newest first
                const aDate = new Date(a.createdAt || 0).getTime();
                const bDate = new Date(b.createdAt || 0).getTime();
                return bDate - aDate;
              });

              // Store the best image for each equipment (first = highest priority)
              for (const doc of sortedDocs) {
                if (!equipmentImages[doc.equipmentId]) {
                  // Ensure HTTPS URL
                  const imageUrl = doc.filePath?.replace(/^http:\/\//, 'https://') || null;
                  const docType = (doc.documentType || '').toLowerCase();
                  const fileName = (doc.fileName || '').toLowerCase();
                  
                  const isCard = docType.includes('istimara') ||
                    docType.includes('license') ||
                    docType.includes('card') ||
                    fileName.includes('istimara') ||
                    fileName.includes('license');
                  
                  equipmentImages[doc.equipmentId] = { url: imageUrl, isCard };
                }
              }
            }

            // Merge equipment data with assignments and maintenance
            const equipmentWithAssignments = equipment.map((item) => {
              const assignments = assignmentsByEquipment[item.id] || [];
              const maintenance = maintenanceByEquipment[item.id] || [];
              
              // Use the actual equipment status from database (which is updated by EquipmentStatusService)
              // This ensures consistency with the status shown on detail pages
              // The status is already calculated correctly by EquipmentStatusService based on all assignments
              const status = item.status || 'available';
              
              return {
                ...item,
                assignments,
                maintenance,
                is_assigned: assignments.length > 0,
                is_under_maintenance: maintenance.length > 0,
                current_assignment: assignments[0] || null,
                current_maintenance: maintenance[0] || null,
                status, // Use actual status from database
                image_url: equipmentImages[item.id]?.url || null,
                image_is_card: equipmentImages[item.id]?.isCard || false,
              };
            });

            return NextResponse.json({
              success: true,
              data: equipmentWithAssignments,
              total,
              page,
              limit,
              totalPages: Math.ceil(total / limit),
              hasNextPage: page < Math.ceil(total / limit),
              hasPrevPage: page > 1,
            });
          } catch (error) {
            console.error('Error fetching equipment assignments:', error);
            
            // Return equipment without assignments if there's an error
            const equipmentWithAssignments = equipment.map((item) => ({
              ...item,
              assignments: [],
              maintenance: [],
              is_assigned: false,
              is_under_maintenance: false,
              current_assignment: null,
              current_maintenance: null,
              status: 'available',
              image_url: null,
              image_is_card: false,
            }));

            return NextResponse.json({
              success: true,
              data: equipmentWithAssignments,
              total: equipmentWithAssignments.length,
            });
          }
        },
        {
          ttl: 600, // 10 minutes - equipment changes less frequently
          prefix: 'equipment',
          tags: [CACHE_TAGS.EQUIPMENT]
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
          category_id: equipmentTable.categoryId,
          manufacturer: equipmentTable.manufacturer,
          daily_rate: equipmentTable.dailyRate,
          weekly_rate: equipmentTable.weeklyRate,
          monthly_rate: equipmentTable.monthlyRate,
          erpnext_id: equipmentTable.erpnextId,
          istimara: equipmentTable.istimara,
          istimara_expiry_date: equipmentTable.istimaraExpiryDate,
          serial_number: equipmentTable.serialNumber,
          chassis_number: equipmentTable.chassisNumber,
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
          maintenance: [],
          is_assigned: false,
          is_under_maintenance: false,
          current_assignment: null,
          current_maintenance: null,
          status: 'available',
          image_url: null,
          image_is_card: false,
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
      chassisNumber,
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
      insurance,
      insurance_expiry_date,
      tuvCard,
      tuv_card_expiry_date,
      gps_install_date,
      gps_expiry_date,
      periodic_examination_date,
      periodic_examination_expiry_date,
    } = body;

    // Auto-extract door number from equipment name if not provided
    const finalDoorNumber = autoExtractDoorNumber(name, doorNumber);

    const inserted = await db
      .insert(equipmentTable)
      .values({
        name,
        description: description ?? null,
        categoryId,
        manufacturer,
        modelNumber,
        serialNumber,
        chassisNumber: chassisNumber ?? null,
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
        insurance: insurance ?? null,
        insuranceExpiryDate: insurance_expiry_date
          ? new Date(insurance_expiry_date).toISOString()
          : null,
        tuvCard: tuvCard ?? null,
        tuvCardExpiryDate: tuv_card_expiry_date
          ? new Date(tuv_card_expiry_date).toISOString()
          : null,
        gpsInstallDate: gps_install_date
          ? new Date(gps_install_date).toISOString()
          : null,
        gpsExpiryDate: gps_expiry_date
          ? new Date(gps_expiry_date).toISOString()
          : null,
        periodicExaminationDate: periodic_examination_date
          ? new Date(periodic_examination_date).toISOString()
          : null,
        periodicExaminationExpiryDate: periodic_examination_expiry_date
          ? new Date(periodic_examination_expiry_date).toISOString()
          : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const equipment = inserted?.[0];

    return NextResponse.json({ 
      success: true, 
      data: equipment!,
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
      chassisNumber,
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
      insurance,
      insurance_expiry_date,
      tuv_card,
      tuv_card_expiry_date,
      gps_install_date,
      gps_expiry_date,
      periodic_examination_date,
      periodic_examination_expiry_date,
    } = body;

    // Auto-extract door number from equipment name if not provided
    const finalDoorNumber = autoExtractDoorNumber(name, doorNumber);

    const updated = await db
      .update(equipmentTable)
      .set({
        name,
        description: description ?? null,
        categoryId: categoryId ?? null,
        manufacturer: manufacturer ?? null,
        modelNumber: modelNumber ?? null,
        serialNumber: serialNumber ?? null,
        chassisNumber: chassisNumber ?? null,
        doorNumber: finalDoorNumber,
        purchaseDate: purchaseDate ? new Date(purchaseDate).toISOString() : null,
        purchasePrice: purchasePrice ? String(parseFloat(purchasePrice)) : null,
        status: status ?? null,
        locationId: locationId ?? null,
        notes: notes ?? null,
        dailyRate: dailyRate ? String(parseFloat(dailyRate)) : null,
        weeklyRate: weeklyRate ? String(parseFloat(weeklyRate)) : null,
        monthlyRate: monthlyRate ? String(parseFloat(monthlyRate)) : null,
        istimara: istimara ?? null,
        istimaraExpiryDate: istimara_expiry_date
          ? new Date(istimara_expiry_date).toISOString()
          : null,
        insurance: insurance ?? null,
        insuranceExpiryDate: insurance_expiry_date
          ? new Date(insurance_expiry_date).toISOString()
          : null,
        tuvCard: tuv_card ?? null,
        tuvCardExpiryDate: tuv_card_expiry_date
          ? new Date(tuv_card_expiry_date).toISOString()
          : null,
        gpsInstallDate: gps_install_date
          ? new Date(gps_install_date).toISOString()
          : null,
        gpsExpiryDate: gps_expiry_date
          ? new Date(gps_expiry_date).toISOString()
          : null,
        periodicExaminationDate: periodic_examination_date
          ? new Date(periodic_examination_date).toISOString()
          : null,
        periodicExaminationExpiryDate: periodic_examination_expiry_date
          ? new Date(periodic_examination_expiry_date).toISOString()
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
