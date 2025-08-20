import { db } from '@/lib/drizzle';
import { customers, projects, rentals, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      console.error('Invalid project ID:', projectId);
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const projectIdNum = parseInt(projectId);

    // First, get the project data
    console.log('Fetching project with ID:', projectIdNum);
    
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
        // Project team roles
        projectManagerId: projects.projectManagerId,
        projectEngineerId: projects.projectEngineerId,
        projectForemanId: projects.projectForemanId,
        supervisorId: projects.supervisorId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
      })
      .from(projects)
      .where(eq(projects.id, projectIdNum))
      .limit(1);

    if (!projectData.length) {
      console.error('Project not found with ID:', projectIdNum);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectData[0];
    if (!project) {
      console.error('Project data is null for ID:', projectIdNum);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('Found project:', project);

    // Get customer data if customerId exists
    let customer: any = null;
    if (project.customerId) {
      try {
        console.log('Fetching customer with ID:', project.customerId);
        
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
        console.log('Found customer:', customer);
        
      } catch (customerError) {
        console.error('Error fetching customer:', customerError);
        customer = null;
      }
    }

    // Get rental data if any exists for this project
    let rental: any = null;
    try {
      console.log('Fetching rental for project ID:', projectIdNum);
      
      const rentalData = await db
        .select({
          id: rentals.id,
          rentalNumber: rentals.rentalNumber,
        })
        .from(rentals)
        .where(eq(rentals.projectId, project.id))
        .limit(1);

      rental = rentalData[0] || null;
      console.log('Found rental:', rental);
      
    } catch (rentalError) {
      console.error('Error fetching rental:', rentalError);
      rental = null;
    }

    // Get project manager data if projectManagerId exists
    let projectManager: any = null;
    if (project.projectManagerId) {
      try {
        console.log('Fetching project manager with ID:', project.projectManagerId);
        
        const managerData = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email,
          })
          .from(employees)
          .where(eq(employees.id, project.projectManagerId))
          .limit(1);

        projectManager = managerData[0] || null;
        console.log('Found project manager:', projectManager);
        
      } catch (managerError) {
        console.error('Error fetching project manager:', managerError);
        projectManager = null;
      }
    }

    // Get project engineer data if projectEngineerId exists
    let projectEngineer: any = null;
    if (project.projectEngineerId) {
      try {
        const engineerData = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email,
          })
          .from(employees)
          .where(eq(employees.id, project.projectEngineerId))
          .limit(1);

        projectEngineer = engineerData[0] || null;
        
      } catch (engineerError) {
        console.error('Error fetching project engineer:', engineerError);
        projectEngineer = null;
      }
    }

    // Get project foreman data if projectForemanId exists
    let projectForeman: any = null;
    if (project.projectForemanId) {
      try {
        const foremanData = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email,
          })
          .from(employees)
          .where(eq(employees.id, project.projectForemanId))
          .limit(1);

        projectForeman = foremanData[0] || null;
        
      } catch (foremanError) {
        console.error('Error fetching project foreman:', foremanError);
        projectForeman = null;
      }
    }

    // Get supervisor data if supervisorId exists
    let supervisor: any = null;
    if (project.supervisorId) {
      try {
        const supervisorData = await db
          .select({
            id: employees.id,
            firstName: employees.firstName,
            lastName: employees.lastName,
            email: employees.email,
          })
          .from(employees)
          .where(eq(employees.id, project.supervisorId))
          .limit(1);

        supervisor = supervisorData[0] || null;
        
      } catch (supervisorError) {
        console.error('Error fetching supervisor:', supervisorError);
        supervisor = null;
      }
    }

    // Transform the data to match the frontend expectations of edit page
    const transformedProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      customer_id: project.customerId ?? null,
      client_name: customer?.name || 'Unknown Client',
      client_contact: customer?.email || customer?.phone || 'No contact info',
      status: project.status,
      priority: 'medium',
      start_date: project.startDate ? project.startDate.toString() : null,
      end_date: project.endDate ? project.endDate.toString() : null,
      budget: Number(project.budget) || 0,
      progress: 0,
      // Project team roles
      project_manager_id: project.projectManagerId,
      project_engineer_id: project.projectEngineerId,
      project_foreman_id: project.projectForemanId,
      supervisor_id: project.supervisorId,
      project_manager: projectManager ? {
        id: projectManager.id.toString(),
        name: `${projectManager.firstName} ${projectManager.lastName}`,
        email: projectManager.email,
      } : null,
      project_engineer: projectEngineer ? {
        id: projectEngineer.id.toString(),
        name: `${projectEngineer.firstName} ${projectEngineer.lastName}`,
        email: projectEngineer.email,
      } : null,
      project_foreman: projectForeman ? {
        id: projectForeman.id.toString(),
        name: `${projectForeman.firstName} ${projectForeman.lastName}`,
        email: projectForeman.email,
      } : null,
      supervisor: supervisor ? {
        id: supervisor.id.toString(),
        name: `${supervisor.firstName} ${supervisor.lastName}`,
        email: supervisor.email,
      } : null,
      location: 'Project Location',
      notes: project.notes || 'Project details and notes.',
      rental: rental,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    };

    console.log('Transformed project data:', transformedProject);

    return NextResponse.json({
      success: true,
      data: transformedProject,
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]:', error);
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
        // Project team roles
        projectManagerId: body.project_manager_id ? parseInt(body.project_manager_id) : null,
        projectEngineerId: body.project_engineer_id ? parseInt(body.project_engineer_id) : null,
        projectForemanId: body.project_foreman_id ? parseInt(body.project_foreman_id) : null,
        supervisorId: body.supervisor_id ? parseInt(body.supervisor_id) : null,
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
        // Project team roles
        projectManagerId: projects.projectManagerId,
        projectEngineerId: projects.projectEngineerId,
        projectForemanId: projects.projectForemanId,
        supervisorId: projects.supervisorId,
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
    console.error('Error updating project:', error);
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
