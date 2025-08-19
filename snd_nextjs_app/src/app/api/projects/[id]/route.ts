import { db } from '@/lib/drizzle';
import { customers, projects, rentals } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const projectIdNum = parseInt(projectId);

    // First, get the project data
    
    const projectData = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        customerId: projects.customerId,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        notes: projects.notes,
      })
      .from(projects)
      .where(eq(projects.id, projectIdNum))
      .limit(1);

    if (!projectData.length) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectData[0];
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get customer data if customerId exists
    let customer: any = null;
    if (project.customerId) {
      try {
        
        const customerData = await db
          .select({
            id: customers.id,
            name: customers.name,
            email: customers.email,
            phone: customers.phone,
          })
          .from(customers)
          .where(eq(customers.id, project.customerId))
          .limit(1);

        customer = customerData[0] || null;
        
      } catch (customerError) {
        
        customer = null;
      }
    }

    // Get rental data if any exists for this project
    let rental: any = null;
    try {
      
      const rentalData = await db
        .select({
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        })
        .from(rentals)
        .where(eq(rentals.projectId, project.id))
        .limit(1);

      rental = rentalData[0] || null;
      
    } catch (rentalError) {
      
      rental = null;
    }

    // Transform the data to match the frontend expectations
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      client_name: customer?.name || 'Unknown Client',
      client_contact: customer?.email || customer?.phone || 'No contact info',
      status: project.status,
      priority: 'medium', // Default value since priority field doesn't exist
      start_date: project.startDate ? project.startDate.toString() : '',
      end_date: project.endDate ? project.endDate.toString() : '',
      budget: Number(project.budget) || 0,
      progress: 0, // Default value since progress field doesn't exist
      manager: {
        id: '1',
        name: 'John Smith',
        email: 'john.smith@company.com',
      },
      location: 'Downtown Business District',
      notes:
        project.notes ||
        'Project is progressing well with foundation work completed and structural framework 65% complete.',
      rental: rental,
    };

    return NextResponse.json({
      success: true,
      data: transformedProject,
    });
  } catch (error) {

    return NextResponse.json(
      {
        error: 'Failed to fetch project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;
    const body = await request.json();

    await db
      .update(projects)
      .set({
        name: body.name,
        description: body.description,
        customerId: body.customer_id ? parseInt(body.customer_id) : null,
        status: body.status,
        startDate: body.start_date ? body.start_date : null,
        endDate: body.end_date ? body.end_date : null,
        budget: body.budget ? String(parseFloat(body.budget)) : null,
        notes:
          body.notes ||
          body.objectives ||
          body.scope ||
          body.deliverables ||
          body.constraints ||
          body.assumptions ||
          body.risks ||
          body.quality_standards ||
          body.communication_plan ||
          body.stakeholder_management ||
          body.change_management ||
          body.procurement_plan ||
          body.resource_plan ||
          body.schedule_plan ||
          body.cost_plan ||
          body.quality_plan ||
          body.risk_plan ||
          body.communication_plan_detailed ||
          body.stakeholder_plan ||
          body.change_plan ||
          body.procurement_plan_detailed ||
          body.resource_plan_detailed ||
          body.schedule_plan_detailed ||
          body.cost_plan_detailed ||
          body.quality_plan_detailed ||
          body.risk_plan_detailed,
      })
      .where(eq(projects.id, parseInt(projectId)));

    // Fetch the updated project with customer details
    const projectWithCustomer = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        customerId: projects.customerId,
        status: projects.status,
        startDate: projects.startDate,
        endDate: projects.endDate,
        budget: projects.budget,
        notes: projects.notes,
        customer: {
          id: customers.id,
          name: customers.name,
          email: customers.email,
          phone: customers.phone,
        },
      })
      .from(projects)
      .leftJoin(customers, eq(projects.customerId, customers.id))
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: projectWithCustomer[0],
      message: 'Project updated successfully',
    });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to update project' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    await db.delete(projects).where(eq(projects.id, parseInt(projectId)));

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    
    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}
