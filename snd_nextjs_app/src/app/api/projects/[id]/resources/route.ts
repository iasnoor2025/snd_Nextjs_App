import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const resources = await prisma.projectResource.findMany({
      where: { projectId },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            modelNumber: true
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Transform the data to match the frontend expectations
    const transformedResources = resources.map(resource => ({
      id: resource.id,
      type: resource.type,
      name: resource.name,
      description: resource.description,
      quantity: resource.quantity,
      unit_cost: resource.unitCost,
      total_cost: resource.totalCost,
      date: resource.date?.toISOString(),
      status: resource.status,
      equipment_name: resource.equipment?.name,
      operator_name: resource.operatorName,
      worker_name: resource.workerName,
      position: resource.position,
      daily_rate: resource.dailyRate,
      days_worked: resource.daysWorked,
      material_name: resource.materialName,
      unit: resource.unit,
      liters: resource.liters,
      price_per_liter: resource.pricePerLiter,
      fuel_type: resource.fuelType,
      category: resource.category,
      expense_description: resource.expenseDescription,
      notes: resource.notes
    }));

    return NextResponse.json({ data: transformedResources });
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

    const resource = await prisma.projectResource.create({
      data: {
        projectId,
        type: body.type,
        name: body.name,
        description: body.description,
        quantity: body.quantity,
        unitCost: body.unit_cost,
        totalCost: body.total_cost,
        date: body.date ? new Date(body.date) : null,
        status: body.status,
        equipmentId: body.equipment_id,
        equipmentType: body.equipment_type,
        equipmentNumber: body.equipment_number,
        operatorName: body.operator_name,
        operatorId: body.operator_id,
        usageHours: body.usage_hours,
        maintenanceCost: body.maintenance_cost,
        employeeId: body.employee_id,
        workerName: body.worker_name,
        position: body.position,
        dailyRate: body.daily_rate,
        daysWorked: body.days_worked,
        materialName: body.material_name,
        unit: body.unit,
        liters: body.liters,
        pricePerLiter: body.price_per_liter,
        fuelType: body.fuel_type,
        category: body.category,
        expenseDescription: body.expense_description,
        notes: body.notes,
        metadata: body.metadata || {}
      },
      include: {
        equipment: {
          select: {
            id: true,
            name: true,
            modelNumber: true
          }
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json({ data: resource }, { status: 201 });
  } catch (error) {
    console.error('Error creating project resource:', error);
    return NextResponse.json(
      { error: 'Failed to create project resource' },
      { status: 500 }
    );
  }
}
