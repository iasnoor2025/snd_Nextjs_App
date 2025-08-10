import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectResources, employees, equipment, employeeAssignments, equipmentRentalHistory } from '@/lib/drizzle/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const resources = await db
      .select({
        id: projectResources.id,
        projectId: projectResources.projectId,
        type: projectResources.type,
        name: projectResources.name,
        description: projectResources.description,
        quantity: projectResources.quantity,
        unitCost: projectResources.unitCost,
        totalCost: projectResources.totalCost,
        date: projectResources.date,
        status: projectResources.status,
        notes: projectResources.notes,
        employeeId: projectResources.employeeId,
        workerName: projectResources.workerName,
        jobTitle: projectResources.jobTitle,
        dailyRate: projectResources.dailyRate,
        daysWorked: projectResources.daysWorked,
        startDate: projectResources.startDate,
        endDate: projectResources.endDate,
        totalDays: projectResources.totalDays,
        equipmentId: projectResources.equipmentId,
        equipmentName: projectResources.equipmentName,
        operatorName: projectResources.operatorName,
        hourlyRate: projectResources.hourlyRate,
        hoursWorked: projectResources.hoursWorked,
        usageHours: projectResources.usageHours,
        maintenanceCost: projectResources.maintenanceCost,
        materialName: projectResources.materialName,
        unit: projectResources.unit,
        unitPrice: projectResources.unitPrice,
        materialId: projectResources.materialId,
        fuelType: projectResources.fuelType,
        liters: projectResources.liters,
        pricePerLiter: projectResources.pricePerLiter,
        category: projectResources.category,
        expenseDescription: projectResources.expenseDescription,
        amount: projectResources.amount,
        title: projectResources.title,
        priority: projectResources.priority,
        dueDate: projectResources.dueDate,
        completionPercentage: projectResources.completionPercentage,
        assignedToId: projectResources.assignedToId,
        createdAt: projectResources.createdAt,
        updatedAt: projectResources.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          designation: employees.designation
        },
        equipment: {
          id: equipment.id,
          name: equipment.name,
          description: equipment.description
        },
        assignedTo: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName
        }
      })
      .from(projectResources)
      .leftJoin(employees, eq(projectResources.employeeId, employees.id))
      .leftJoin(equipment, eq(projectResources.equipmentId, equipment.id))
      .leftJoin(employees, eq(projectResources.assignedToId, employees.id))
      .where(eq(projectResources.projectId, parseInt(projectId)))
      .orderBy(desc(projectResources.createdAt));

    return NextResponse.json({ 
      success: true,
      data: resources 
    });
  } catch (error) {
    console.error('Error fetching project resources:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project resources' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      );
    }

    // Prepare the data for insertion
    const resourceData = {
      projectId: parseInt(projectId),
      type: body.type,
      name: body.name,
      description: body.description,
      quantity: body.quantity ? parseInt(body.quantity) : null,
      unitCost: body.unit_cost ? parseFloat(body.unit_cost) : null,
      totalCost: body.total_cost ? parseFloat(body.total_cost) : null,
      date: body.date ? new Date(body.date) : null,
      status: body.status || 'pending',
      notes: body.notes,

      // Manpower specific fields
      employeeId: body.employee_id ? parseInt(body.employee_id) : null,
      workerName: body.worker_name,
      jobTitle: body.job_title,
      dailyRate: body.daily_rate ? parseFloat(body.daily_rate) : null,
      daysWorked: body.days_worked ? parseInt(body.days_worked) : null,
      startDate: body.start_date ? new Date(body.start_date) : null,
      endDate: body.end_date ? new Date(body.end_date) : null,
      totalDays: body.total_days ? parseInt(body.total_days) : null,

      // Equipment specific fields
      equipmentId: body.equipment_id ? parseInt(body.equipment_id) : null,
      equipmentName: body.equipment_name,
      operatorName: body.operator_name,
      hourlyRate: body.hourly_rate ? parseFloat(body.hourly_rate) : null,
      hoursWorked: body.hours_worked ? parseFloat(body.hours_worked) : null,
      usageHours: body.usage_hours ? parseFloat(body.usage_hours) : null,
      maintenanceCost: body.maintenance_cost ? parseFloat(body.maintenance_cost) : null,

      // Material specific fields
      materialName: body.material_name,
      unit: body.unit,
      unitPrice: body.unit_price ? parseFloat(body.unit_price) : null,
      materialId: body.material_id ? parseInt(body.material_id) : null,

      // Fuel specific fields
      fuelType: body.fuel_type,
      liters: body.liters ? parseFloat(body.liters) : null,
      pricePerLiter: body.price_per_liter ? parseFloat(body.price_per_liter) : null,

      // Expense specific fields
      category: body.category,
      expenseDescription: body.expense_description,
      amount: body.amount ? parseFloat(body.amount) : null,

      // Task specific fields
      title: body.title,
      priority: body.priority,
      dueDate: body.due_date ? new Date(body.due_date) : null,
      completionPercentage: body.completion_percentage ? parseInt(body.completion_percentage) : null,
      assignedToId: body.assigned_to_id ? parseInt(body.assigned_to_id) : null,
    };

    const insertedResource = await db
      .insert(projectResources)
      .values(resourceData)
      .returning();

    const resource = insertedResource[0];

    // If this is a manpower resource with an employee, create an employee assignment
    if (body.type === 'manpower' && body.employee_id) {
      try {
        console.log('Creating employee assignment for employee:', body.employee_id);
        await db
          .insert(employeeAssignments)
          .values({
            employeeId: parseInt(body.employee_id),
            projectId: parseInt(projectId),
            name: `${body.name} Assignment`,
            startDate: body.start_date ? new Date(body.start_date) : new Date(),
            endDate: body.end_date ? new Date(body.end_date) : null,
            notes: body.notes,
            status: 'active',
            type: 'project'
          });
        console.log('Employee assignment created successfully');
      } catch (assignmentError) {
        console.error('Error creating employee assignment:', assignmentError);
        // Don't fail the resource creation if assignment creation fails
      }
    }

    // If this is an equipment resource, create an equipment assignment
    if (body.type === 'equipment' && body.equipment_id) {
      try {
        console.log('Creating equipment assignment for equipment:', body.equipment_id);
        await db
          .insert(equipmentRentalHistory)
          .values({
            equipmentId: parseInt(body.equipment_id),
            assignmentType: 'project',
            projectId: parseInt(projectId),
            startDate: body.start_date ? new Date(body.start_date) : new Date(),
            endDate: body.end_date ? new Date(body.end_date) : null,
            dailyRate: body.hourly_rate ? parseFloat(body.hourly_rate) * 8 : null, // Convert hourly to daily
            totalAmount: body.total_cost ? parseFloat(body.total_cost) : null,
            notes: body.notes,
            status: 'active'
          });
        console.log('Equipment assignment created successfully');
      } catch (assignmentError) {
        console.error('Error creating equipment assignment:', assignmentError);
        // Don't fail the resource creation if assignment creation fails
      }
    }

    return NextResponse.json({ 
      success: true,
      data: resource 
    });
  } catch (error) {
    console.error('Error creating project resource:', error);
    return NextResponse.json(
      { error: 'Failed to create project resource' },
      { status: 500 }
    );
  }
}
