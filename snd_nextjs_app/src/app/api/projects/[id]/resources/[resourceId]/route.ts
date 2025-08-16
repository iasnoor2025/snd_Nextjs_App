import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectResources } from '@/lib/drizzle/schema';
import { eq, and } from 'drizzle-orm';
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const { id: projectId, resourceId } = await params;
    const body = await request.json();

    // Validate required fields
    if (!body.type || !body.name) {
      return NextResponse.json(
        { error: 'Type and name are required' },
        { status: 400 }
      );
    }

    // Prepare the data for update
    const resourceData = {
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
      employeeName: body.employee_name,
      employeeFileNumber: body.employee_file_number,
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
      dueDate: body.due_date ? new Date(body.due_date).toISOString() : null,
      completionPercentage: body.completion_percentage ? parseInt(body.completion_percentage) : null,
      assignedToId: body.assigned_to_id ? parseInt(body.assigned_to_id) : null,
    };

    // Update the resource
    const updatedResource = await db
      .update(projectResources)
      .set({
        ...resourceData,
        // Convert numeric fields to strings as expected by the schema
        unitCost: resourceData.unitCost ? resourceData.unitCost.toString() : null,
        totalCost: resourceData.totalCost ? resourceData.totalCost.toString() : null,
        dailyRate: resourceData.dailyRate ? resourceData.dailyRate.toString() : null,
        hourlyRate: resourceData.hourlyRate ? resourceData.hourlyRate.toString() : null,
        // hoursWorked field removed - not in schema
        usageHours: resourceData.usageHours ? resourceData.usageHours.toString() : null,
        maintenanceCost: resourceData.maintenanceCost ? resourceData.maintenanceCost.toString() : null,
        unitPrice: resourceData.unitPrice ? resourceData.unitPrice.toString() : null,
        liters: resourceData.liters ? resourceData.liters.toString() : null,
        pricePerLiter: resourceData.pricePerLiter ? resourceData.pricePerLiter.toString() : null,
        amount: resourceData.amount ? resourceData.amount.toString() : null,
        // Convert date fields to strings
        date: resourceData.date ? new Date(resourceData.date).toISOString() : null,
        startDate: resourceData.startDate ? new Date(resourceData.startDate).toISOString() : null,
        endDate: resourceData.endDate ? new Date(resourceData.endDate).toISOString() : null,
        dueDate: resourceData.dueDate ? new Date(resourceData.dueDate).toISOString() : null,
        updatedAt: new Date().toISOString()
      })
      .where(
        and(
          eq(projectResources.id, parseInt(resourceId)),
          eq(projectResources.projectId, parseInt(projectId))
        )
      )
      .returning();

    const resource = updatedResource[0];

    if (!resource) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      data: resource 
    });
  } catch (error) {
    console.error('Error updating project resource:', error);
    return NextResponse.json(
      { error: 'Failed to update project resource' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const { id: projectId, resourceId } = await params;

    console.log('Deleting project resource:', { projectId, resourceId });

    // Delete the resource
    const deletedResource = await db
      .delete(projectResources)
      .where(
        and(
          eq(projectResources.id, parseInt(resourceId)),
          eq(projectResources.projectId, parseInt(projectId))
        )
      )
      .returning();

    if (deletedResource.length === 0 || !deletedResource[0]) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      );
    }

    const deletedResourceItem = deletedResource[0];
    console.log('Resource deleted successfully:', deletedResourceItem.id);

    return NextResponse.json({ 
      success: true,
      message: 'Resource deleted successfully',
      data: deletedResourceItem
    });
  } catch (error) {
    console.error('Error deleting project resource:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { 
        error: 'Failed to delete project resource',
        details: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      },
      { status: 500 }
    );
  }
} 