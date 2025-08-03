import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
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
      unit_cost: body.unit_cost ? parseFloat(body.unit_cost) : null,
      total_cost: body.total_cost ? parseFloat(body.total_cost) : null,
      date: body.date ? new Date(body.date) : null,
      status: body.status || 'pending',
      notes: body.notes,

      // Manpower specific fields
      employee_id: body.employee_id ? parseInt(body.employee_id) : null,
      worker_name: body.worker_name,
      job_title: body.job_title,
      daily_rate: body.daily_rate ? parseFloat(body.daily_rate) : null,
      days_worked: body.days_worked ? parseInt(body.days_worked) : null,
      start_date: body.start_date ? new Date(body.start_date) : null,
      end_date: body.end_date ? new Date(body.end_date) : null,
      total_days: body.total_days ? parseInt(body.total_days) : null,

      // Equipment specific fields
      equipment_id: body.equipment_id ? parseInt(body.equipment_id) : null,
      equipment_name: body.equipment_name,
      operator_name: body.operator_name,
      hourly_rate: body.hourly_rate ? parseFloat(body.hourly_rate) : null,
      hours_worked: body.hours_worked ? parseFloat(body.hours_worked) : null,
      usage_hours: body.usage_hours ? parseFloat(body.usage_hours) : null,
      maintenance_cost: body.maintenance_cost ? parseFloat(body.maintenance_cost) : null,

      // Material specific fields
      material_name: body.material_name,
      unit: body.unit,
      unit_price: body.unit_price ? parseFloat(body.unit_price) : null,
      material_id: body.material_id ? parseInt(body.material_id) : null,

      // Fuel specific fields
      fuel_type: body.fuel_type,
      liters: body.liters ? parseFloat(body.liters) : null,
      price_per_liter: body.price_per_liter ? parseFloat(body.price_per_liter) : null,

      // Expense specific fields
      category: body.category,
      expense_description: body.expense_description,
      amount: body.amount ? parseFloat(body.amount) : null,

      // Task specific fields
      title: body.title,
      priority: body.priority,
      due_date: body.due_date ? new Date(body.due_date) : null,
      completion_percentage: body.completion_percentage ? parseInt(body.completion_percentage) : null,
      assigned_to_id: body.assigned_to_id ? parseInt(body.assigned_to_id) : null,
    };

    const resource = await prisma.projectResource.update({
      where: {
        id: parseInt(resourceId),
        project_id: parseInt(projectId)
      },
      data: resourceData,
      include: {
        employee: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            designation: true
          }
        },
        equipment: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        assigned_to: {
          select: {
            id: true,
            first_name: true,
            last_name: true
          }
        }
      }
    });

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
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resourceId: string }> }
) {
  try {
    const { id: projectId, resourceId } = await params;

    await prisma.projectResource.delete({
      where: {
        id: parseInt(resourceId),
        project_id: parseInt(projectId)
      }
    });

    return NextResponse.json({ 
      success: true,
      message: 'Resource deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting project resource:', error);
    return NextResponse.json(
      { error: 'Failed to delete project resource' },
      { status: 500 }
    );
  }
} 