import { db } from '@/lib/drizzle';
import {
  customers,
  employeeAssignments,
  employees,
  equipment,
  equipmentRentalHistory,
  projects,
  projectEquipment,
  projectManpower,
  rentals,
  rentalItems,
} from '@/lib/drizzle/schema';
import { CentralAssignmentService } from '@/lib/services/central-assignment-service';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

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

const getEquipmentRentalsHandler = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  try {
    // Get session for user ID if needed (middleware handles auth)
    const session = await getServerSession();

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
          status: rentals.status,
          startDate: rentals.startDate,
          expectedEndDate: rentals.expectedEndDate,
          actualEndDate: rentals.actualEndDate,
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
        // Rental item information (for rental assignments)
        rentalItem: {
          id: rentalItems.id,
          totalPrice: rentalItems.totalPrice,
          unitPrice: rentalItems.unitPrice,
          rateType: rentalItems.rateType,
          startDate: rentalItems.startDate,
          completedDate: rentalItems.completedDate,
          status: rentalItems.status,
        },
      })
      .from(equipmentRentalHistory)
      .leftJoin(rentals, eq(equipmentRentalHistory.rentalId, rentals.id))
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .leftJoin(projects, eq(equipmentRentalHistory.projectId, projects.id))
      .leftJoin(employees, eq(equipmentRentalHistory.employeeId, employees.id))
      .leftJoin(
        rentalItems,
        and(
          eq(rentalItems.rentalId, equipmentRentalHistory.rentalId),
          eq(rentalItems.equipmentId, equipmentRentalHistory.equipmentId)
        )
      )
      .where(eq(equipmentRentalHistory.equipmentId, id))
      .orderBy(desc(equipmentRentalHistory.createdAt));

    console.log('Enhanced rental history fetched with JOINs, count:', rentalHistoryWithJoins.length);

    // Fetch project equipment assignments
    console.log('Fetching project equipment assignments...');
    const projectEquipmentAssignments = await db
      .select({
        id: projectEquipment.id,
        projectId: projectEquipment.projectId,
        equipmentId: projectEquipment.equipmentId,
        operatorId: projectEquipment.operatorId,
        startDate: projectEquipment.startDate,
        endDate: projectEquipment.endDate,
        hourlyRate: projectEquipment.hourlyRate,
        estimatedHours: projectEquipment.estimatedHours,
        actualHours: projectEquipment.actualHours,
        maintenanceCost: projectEquipment.maintenanceCost,
        status: projectEquipment.status,
        notes: projectEquipment.notes,
        createdAt: projectEquipment.createdAt,
        updatedAt: projectEquipment.updatedAt,
        // Project information
        project: {
          id: projects.id,
          name: projects.name,
          description: projects.description,
          status: projects.status,
        },
        // Operator information (from projectManpower)
        operator: {
          id: projectManpower.id,
          employeeId: projectManpower.employeeId,
          workerName: projectManpower.workerName,
          jobTitle: projectManpower.jobTitle,
        },
        // Employee information (if operator is an employee)
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          fileNumber: employees.fileNumber,
          email: employees.email,
          phone: employees.phone,
        },
      })
      .from(projectEquipment)
      .leftJoin(projects, eq(projectEquipment.projectId, projects.id))
      .leftJoin(projectManpower, eq(projectEquipment.operatorId, projectManpower.id))
      .leftJoin(employees, eq(projectManpower.employeeId, employees.id))
      .where(eq(projectEquipment.equipmentId, id))
      .orderBy(desc(projectEquipment.createdAt));

    console.log('Project equipment assignments fetched, count:', projectEquipmentAssignments.length);

    // Get operator counts for rental assignments
    const rentalIds = rentalHistoryWithJoins
      .filter(item => item.rentalId)
      .map(item => item.rentalId!)
      .filter((id, index, self) => self.indexOf(id) === index); // Get unique rental IDs

    const operatorCounts: Record<number, number> = {};
    if (rentalIds.length > 0) {
      const operatorData = await db
        .select({
          rentalId: rentalItems.rentalId,
          operatorId: rentalItems.operatorId,
        })
        .from(rentalItems)
        .where(
          and(
            eq(rentalItems.equipmentId, id),
            inArray(rentalItems.rentalId, rentalIds)
          )
        );

      // Count unique operators per rental
      rentalIds.forEach(rentalId => {
        const operators = new Set(
          operatorData
            .filter(item => item.rentalId === rentalId && item.operatorId)
            .map(item => item.operatorId!)
        );
        operatorCounts[rentalId] = operators.size;
      });
    }

    // Helper function to parse Decimal types to numbers
    const parseDecimal = (value: any): number => {
      if (!value) return 0;
      if (typeof value === 'string') return parseFloat(value) || 0;
      if (typeof value === 'number') return value;
      // Handle Decimal type from drizzle
      return parseFloat(value.toString()) || 0;
    };

    // Helper function to calculate total based on duration
    const calculateTotalByDuration = (
      unitPrice: number,
      rateType: string,
      startDate: string | Date | null,
      endDate: string | Date | null,
      status: string,
      quantity: number = 1
    ): number => {
      if (!startDate) return 0;

      const start = new Date(startDate);
      let end: Date;

      // Determine end date
      if (endDate) {
        // If we have an end date, use it (for completed/cancelled or expected end dates)
        end = new Date(endDate);
        // But if status is active and end date is in the future, calculate to today instead
        if (status === 'active' && end > new Date()) {
          end = new Date();
        }
      } else {
        // For active assignments without end date, calculate to today
        end = new Date();
      }

      // Ensure we don't go before the start date
      if (end < start) {
        end = start;
      }

      // Calculate based on rate type
      if (rateType === 'hourly') {
        const hoursDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
        return unitPrice * hoursDiff * quantity;
      } else if (rateType === 'weekly') {
        const weeksDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        return unitPrice * weeksDiff * quantity;
      } else if (rateType === 'monthly') {
        const monthsDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        return unitPrice * monthsDiff * quantity;
      } else {
        // Daily rate - calculate days
        const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        return unitPrice * daysDiff * quantity;
      }
    };

    // Transform project equipment assignments to match the expected format

    const projectEquipmentHistory = projectEquipmentAssignments.map(item => {
      // Calculate total price: (hourlyRate * estimatedHours) + maintenanceCost
      const hourlyRate = parseDecimal(item.hourlyRate);
      const estimatedHours = parseDecimal(item.estimatedHours) || parseDecimal(item.actualHours) || 0;
      const maintenanceCost = parseDecimal(item.maintenanceCost) || 0;
      const totalPrice = (hourlyRate * estimatedHours) + maintenanceCost;

      // Calculate duration in days
      const calculateDuration = (start: string | Date | null, end: string | Date | null, status: string): number => {
        if (!start) return 0;
        const startDate = new Date(start);
        let endDate: Date;
        
        if (end && (status === 'completed' || status === 'returned' || status === 'damaged')) {
          endDate = new Date(end);
        } else {
          endDate = new Date();
        }
        
        if (endDate < startDate) {
          endDate = startDate;
        }
        
        const diffTime = endDate.getTime() - startDate.getTime();
        return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      };

      const durationDays = calculateDuration(item.startDate, item.endDate, item.status);

      // Get operator name
      let operatorName = null;
      if (item.employee) {
        operatorName = `${item.employee.firstName} ${item.employee.lastName}`.trim();
      } else if (item.operator?.workerName) {
        operatorName = item.operator.workerName;
      }

      // Map status from project_equipment to assignment status
      let displayStatus = item.status;
      if (item.status === 'returned' || item.status === 'damaged') {
        displayStatus = 'completed';
      }

      return {
        id: `project_${item.id}`, // Prefix to avoid conflicts with rental history IDs
        rental_id: null,
        rental_number: null,
        customer_name: null,
        customer_email: null,
        customer_phone: null,
        project_id: item.projectId,
        project_name: item.project?.name || null,
        project_description: item.project?.description || null,
        project_status: item.project?.status || null,
        employee_id: item.employee?.id || null,
        employee_name: operatorName,
        employee_id_number: item.employee?.fileNumber || null,
        employee_email: item.employee?.email || null,
        employee_phone: item.employee?.phone || null,
        assignment_type: 'project',
        equipment_name: equipmentItem.name,
        equipment_door_number: equipmentItem.doorNumber || null,
        quantity: 1,
        unit_price: hourlyRate,
        total_price: totalPrice,
        rate_type: 'hourly', // Project equipment uses hourly rate
        status: displayStatus,
        notes: item.notes,
        rental_start_date: item.startDate ? new Date(item.startDate).toISOString() : null,
        rental_expected_end_date: item.endDate ? new Date(item.endDate).toISOString() : null,
        rental_actual_end_date: item.endDate ? new Date(item.endDate).toISOString() : null,
        rental_status: item.status,
        duration_days: durationDays,
        operator_count: item.operatorId ? 1 : 0,
        created_at: item.createdAt ? new Date(item.createdAt).toISOString() : null,
        updated_at: item.updatedAt ? new Date(item.updatedAt).toISOString() : null,
      };
    });

    // Transform the rental history data to match the expected format
    const history = rentalHistoryWithJoins.map(item => {

      let totalPrice = 0;
      let unitPrice = parseDecimal(item.dailyRate);
      let rateType = 'daily';
      let effectiveStartDate: string | Date | null = item.startDate;
      let effectiveEndDate: string | Date | null = item.endDate;
      let effectiveStatus = item.status;

      if (item.assignmentType === 'rental') {
        // For rental assignments, calculate based on rental item duration
        if (item.rentalItem) {
          unitPrice = parseDecimal(item.rentalItem.unitPrice) || parseDecimal(item.dailyRate);
          rateType = item.rentalItem.rateType || 'daily';
          
          // Use rental item's start date if available, otherwise use assignment start date
          effectiveStartDate = item.rentalItem.startDate || item.startDate;
          
          // Use rental item's completed date if available, otherwise use rental's end date or assignment end date
          if (item.rentalItem.completedDate) {
            effectiveEndDate = item.rentalItem.completedDate;
            effectiveStatus = 'completed';
          } else if (item.rental?.actualEndDate) {
            effectiveEndDate = item.rental.actualEndDate;
            effectiveStatus = item.rental.status || item.status;
          } else if (item.rental?.expectedEndDate) {
            effectiveEndDate = item.rental.expectedEndDate;
            effectiveStatus = item.rental.status || item.status;
          } else {
            effectiveEndDate = item.endDate;
          }

          // Calculate total based on actual duration
          totalPrice = calculateTotalByDuration(
            unitPrice,
            rateType,
            effectiveStartDate,
            effectiveEndDate,
            effectiveStatus,
            1
          );
        } else {
          // Fallback to stored totalAmount if rental item not found
          totalPrice = parseDecimal(item.totalAmount);
        }
      } else if (item.assignmentType === 'project') {
        // For project assignments, calculate based on assignment duration
        unitPrice = parseDecimal(item.dailyRate);
        rateType = 'daily'; // Projects typically use daily rate
        
        // Calculate total based on assignment duration
        totalPrice = calculateTotalByDuration(
          unitPrice,
          rateType,
          item.startDate,
          item.endDate,
          item.status,
          1
        );
      } else {
        // For manual assignments, use stored totalAmount or calculate if dates available
        unitPrice = parseDecimal(item.dailyRate);
        rateType = 'daily';
        
        if (item.startDate && item.endDate) {
          // Calculate based on duration
          totalPrice = calculateTotalByDuration(
            unitPrice,
            rateType,
            item.startDate,
            item.endDate,
            item.status,
            1
          );
        } else {
          // Use stored totalAmount
          totalPrice = parseDecimal(item.totalAmount);
        }
      }

      // Calculate duration in days
      const calculateDuration = (start: string | Date | null, end: string | Date | null, status: string): number => {
        if (!start) return 0;
        const startDate = new Date(start);
        let endDate: Date;
        
        if (end && (status === 'completed' || status === 'cancelled')) {
          endDate = new Date(end);
        } else {
          endDate = new Date();
        }
        
        if (endDate < startDate) {
          endDate = startDate;
        }
        
        const diffTime = endDate.getTime() - startDate.getTime();
        return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      };

      const durationDays = calculateDuration(
        effectiveStartDate,
        effectiveEndDate,
        effectiveStatus
      );

      // Determine the correct status to display
      // For rental assignments, prioritize rental item status if it's completed
      // Otherwise use the assignment status from equipment_rental_history
      let displayStatus = item.status;
      if (item.assignmentType === 'rental' && item.rentalItem) {
        // If rental item status is completed, the assignment should show as completed
        if (item.rentalItem.status === 'completed' || item.rentalItem.completedDate) {
          displayStatus = 'completed';
        }
      }

      return {
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
        unit_price: unitPrice,
        total_price: totalPrice,
        rate_type: rateType,
        status: displayStatus, // Use the determined status
        notes: item.notes,
        rental_start_date: item.startDate,
        rental_expected_end_date: item.endDate,
        rental_actual_end_date: item.endDate,
        rental_status: item.status,
        duration_days: durationDays,
        operator_count: item.rentalId ? (operatorCounts[item.rentalId] || 0) : 0,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
      };
    });

    console.log('History transformed successfully');

    // Merge both histories and sort by creation date (most recent first)
    const allHistory = [...history, ...projectEquipmentHistory].sort((a, b) => {
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA; // Descending order (most recent first)
    });

    console.log('Total assignment history count:', allHistory.length);

    return NextResponse.json({
      success: true,
      data: allHistory,
      count: allHistory.length,
      message: 'Equipment assignment history loaded successfully',
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
};

const createEquipmentRentalHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    // Get session for user ID if needed (middleware handles auth)
    const session = await getServerSession();

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

    // Use central assignment service for equipment assignment (with automatic completion)
    const createdRentalHistory = await CentralAssignmentService.createAssignment({
      type: 'equipment',
      entityId: id,
      assignmentType: assignment_type,
      startDate: new Date(start_date).toISOString().split('T')[0],
      endDate: end_date ? new Date(end_date).toISOString().split('T')[0] : undefined,
      status,
      notes: notes || '',
      rentalId: assignment_type === 'rental' ? body.rental_id : undefined,
      projectId: assignment_type === 'project' ? project_id : undefined,
      operatorId: assignment_type === 'manual' ? employee_id : undefined,
      unitPrice: daily_rate ? parseFloat(daily_rate) : undefined,
      totalPrice: total_amount ? parseFloat(total_amount) : undefined,
    });

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
      .where(eq(equipmentRentalHistory.id, (createdRentalHistory as any)?.id || 0))
      .limit(1);

    // If this is a manual assignment with an employee, also create an employee assignment using central service
    let employeeAssignment: any = null;
    if (assignment_type === 'manual' && employee_id) {
      try {
        employeeAssignment = await CentralAssignmentService.createAssignment({
          type: 'employee',
          entityId: parseInt(employee_id),
          assignmentType: 'manual',
          startDate: new Date(start_date).toISOString().split('T')[0],
          endDate: end_date ? new Date(end_date).toISOString().split('T')[0] : undefined,
          status: 'active',
          notes: `Manual equipment assignment: ${notes || 'No additional notes'}`,
          equipmentName: equipmentItem.name,
        });

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
};

export const GET = withPermission(PermissionConfigs.equipment.read)(getEquipmentRentalsHandler);
export const POST = withPermission(PermissionConfigs.equipment.create)(createEquipmentRentalHandler);
