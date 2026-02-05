import { db } from '@/lib/drizzle';
import { customers, projects, rentals, employees, locations } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { getServerSession } from '@/lib/auth';
import { logger } from '@/lib/logger';

const getProjectHandler = async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      console.error('Invalid project ID:', projectId);
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    const projectIdNum = parseInt(projectId);
    logger.log(`[GET /api/projects/${projectId}] Fetching project with ID: ${projectIdNum}`);

    // First, get the project data
    // Try with priority first, fallback if column doesn't exist
    let projectData;
    let hasPriorityColumn = true;

    try {
      projectData = await db
        .select({
          id: projects.id,
          name: projects.name,
          description: projects.description,
          customerId: projects.customerId,
          locationId: projects.locationId,
          status: projects.status,
          priority: projects.priority,
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
    } catch (dbError: any) {
      // Check if error is due to missing priority column
      const errorMessage = dbError?.message || String(dbError);
      const errorString = String(dbError);
      const errorCode = dbError?.code || dbError?.errno || '';

      console.error('Database query error:', {
        message: errorMessage,
        code: errorCode,
        string: errorString,
        error: dbError
      });

      if (
        errorMessage.includes('priority') ||
        errorString.includes('priority') ||
        errorMessage.includes('column') ||
        errorString.includes('column') ||
        errorMessage.includes('42703') ||
        errorString.includes('42703') ||
        errorCode === '42703' ||
        errorMessage.includes('does not exist') ||
        errorString.includes('does not exist')
      ) {
        console.warn('⚠️  Priority column not found, fetching without it. Run migration: npx tsx scripts/add-priority-column.ts');
        hasPriorityColumn = false;
        // Retry without priority column
        try {
          projectData = await db
            .select({
              id: projects.id,
              name: projects.name,
              description: projects.description,
              customerId: projects.customerId,
              locationId: projects.locationId,
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
          // Add default priority
          projectData = projectData.map((p: any) => ({ ...p, priority: 'medium' }));
        } catch (retryError) {
          console.error('Error retrying query without priority:', retryError);
          throw retryError;
        }
      } else {
        // Re-throw if it's a different error
        throw dbError;
      }
    }

    if (!projectData.length) {
      console.error('Project not found with ID:', projectIdNum);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const project = projectData[0];
    if (!project) {
      console.error('Project data is null for ID:', projectIdNum);
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
        console.error('Error fetching customer:', customerError);
        customer = null;
      }
    }

    // Get location data if locationId exists
    let location: any = null;
    if (project.locationId) {
      try {
        const locationData = await db
          .select({
            id: locations.id,
            name: locations.name,
            city: locations.city,
            state: locations.state,
            country: locations.country,
          })
          .from(locations)
          .where(eq(locations.id, project.locationId))
          .limit(1);

        location = locationData[0] || null;
      } catch (locationError) {
        console.error('Error fetching location:', locationError);
        location = null;
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
      console.error('Error fetching rental:', rentalError);
      rental = null;
    }

    // Get project manager data if projectManagerId exists
    let projectManager: any = null;
    if (project.projectManagerId) {
      try {
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
      location_id: project.locationId ?? null,
      client_name: customer?.name || 'Unknown Client',
      client_contact: customer?.email || customer?.phone || 'No contact info',
      status: project.status,
      priority: project.priority || 'medium',
      // Return dates as YYYY-MM-DD strings to avoid timezone issues
      start_date: project.startDate ? String(project.startDate).split('T')[0] : null,
      end_date: project.endDate ? String(project.endDate).split('T')[0] : null,
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
      location: location ? `${location.name}, ${location.city}, ${location.state}` : 'Location not specified',
      notes: project.notes || 'Project details and notes.',
      rental: rental,
      created_at: project.createdAt,
      updated_at: project.updatedAt,
    };
    return NextResponse.json({
      success: true,
      data: transformedProject,
    });
  } catch (error) {
    console.error('Error in GET /api/projects/[id]:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorString = String(error);

    // Check if it's a database column error (priority column might not exist)
    if (
      errorMessage.includes('priority') ||
      errorString.includes('priority') ||
      errorMessage.includes('column') ||
      errorString.includes('column') ||
      errorMessage.includes('42703') ||
      errorString.includes('42703') ||
      errorMessage.includes('does not exist') ||
      errorString.includes('does not exist')
    ) {
      console.error('⚠️  Priority column may not exist in database. Please run migration:');
      console.error('   npx tsx scripts/add-priority-column.ts');
      return NextResponse.json(
        {
          error: 'Database schema mismatch: priority column missing',
          details: 'Please run the migration script to add the priority column: npx tsx scripts/add-priority-column.ts',
          hint: errorMessage,
          fullError: process.env.NODE_ENV === 'development' ? errorString : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch project',
        details: errorMessage,
        fullError: process.env.NODE_ENV === 'development' ? errorString : undefined,
      },
      { status: 500 }
    );
  }
};

const updateProjectHandler = async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await request.json();

    // Log the received priority value for debugging
    logger.log(`[PUT /api/projects/${projectId}] Updating project. Received priority:`, body.priority);

    // Only default to 'medium' if priority is not provided (null/undefined), not if it's an empty string
    const priorityValue = body.priority !== undefined && body.priority !== null && body.priority !== ''
      ? body.priority
      : (body.priority === '' ? 'medium' : 'medium');
    logger.log(`[PUT /api/projects/${projectId}] Using priority value:`, priorityValue);
    logger.log(`[PUT /api/projects/${projectId}] Full body received:`, JSON.stringify(body, null, 2));

    const updateResult = await db
      .update(projects)
      .set({
        name: body.name,
        description: body.description,
        customerId: body.customer_id ? parseInt(body.customer_id) : null,
        locationId: body.location_id ? parseInt(body.location_id) : null,
        status: body.status,
        priority: priorityValue,
        // Store dates as YYYY-MM-DD strings to avoid timezone issues
        startDate: body.start_date ? body.start_date.split('T')[0] : null,
        endDate: body.end_date ? body.end_date.split('T')[0] : null,
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
      .where(eq(projects.id, parseInt(projectId)))
      .returning();

    logger.log(`[PUT /api/projects/${projectId}] Update result:`, updateResult);
    logger.log(`[PUT /api/projects/${projectId}] Updated priority in DB:`, updateResult[0]?.priority);

    // Fetch the updated project with customer details
    const projectWithCustomer = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        customerId: projects.customerId,
        status: projects.status,
        priority: projects.priority,
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

    const updatedProject = projectWithCustomer[0];
    logger.log(`[PUT /api/projects/${projectId}] Updated project priority:`, updatedProject?.priority);

    // Transform response to match frontend expectations (same format as GET)
    const transformedResponse = {
      ...updatedProject,
      priority: updatedProject?.priority || 'medium',
    };

    return NextResponse.json({
      success: true,
      data: transformedResponse,
      message: 'Project updated successfully',
    });
  } catch (error) {
    console.error('Error updating project:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));

    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a database column error (priority column might not exist)
    if (errorMessage.includes('priority') || errorMessage.includes('column') || errorMessage.includes('42703')) {
      console.error('⚠️  Priority column may not exist in database. Please run migration:');
      console.error('   npx tsx scripts/add-priority-column.ts');
      return NextResponse.json(
        {
          error: 'Database schema mismatch: priority column missing',
          details: 'Please run the migration script to add the priority column: npx tsx scripts/add-priority-column.ts',
          hint: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to update project',
        details: errorMessage,
        fullError: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
};

const deleteProjectHandler = async (
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      // This should not happen as withPermission handles auth, but keep for safety
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    await db.delete(projects).where(eq(projects.id, parseInt(projectId)));

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {

    return NextResponse.json({ error: 'Failed to delete project' }, { status: 500 });
  }
};

export const GET = withPermission(PermissionConfigs.project.read)(getProjectHandler);
export const PUT = withPermission(PermissionConfigs.project.update)(updateProjectHandler);
export const DELETE = withPermission(PermissionConfigs.project.delete)(deleteProjectHandler);
