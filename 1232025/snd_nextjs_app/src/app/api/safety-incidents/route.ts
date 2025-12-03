import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { safetyIncidents, employees } from '@/lib/drizzle/schema';
import { eq, and, desc, asc, like } from 'drizzle-orm';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';

export const GET = withPermission(PermissionConfigs.safety.read)(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const severity = searchParams.get('severity') || '';
    const status = searchParams.get('status') || '';
    const location = searchParams.get('location') || '';

    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [];
    
    if (search) {
      whereConditions.push(
        like(safetyIncidents.title, `%${search}%`)
      );
    }
    
    if (severity && severity !== 'all') {
      whereConditions.push(eq(safetyIncidents.severity, severity));
    }
    
    if (status && status !== 'all') {
      whereConditions.push(eq(safetyIncidents.status, status));
    }
    
    if (location && location !== 'all') {
      whereConditions.push(eq(safetyIncidents.location, location));
    }

    // Get total count
    let total = 0;
    try {
      const totalCount = await db
        .select({ count: safetyIncidents.id })
        .from(safetyIncidents)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

      total = totalCount.length;
    } catch (countError) {
      console.error('Error counting safety incidents:', countError);
      total = 0;
    }

    // Get incidents with pagination
    let incidents = [];
    try {
      incidents = await db
        .select({
          id: safetyIncidents.id,
          title: safetyIncidents.title,
          description: safetyIncidents.description,
          severity: safetyIncidents.severity,
          status: safetyIncidents.status,
          reportedBy: safetyIncidents.reportedBy,
          assignedToId: safetyIncidents.assignedToId,
          location: safetyIncidents.location,
          incidentDate: safetyIncidents.incidentDate,
          resolvedDate: safetyIncidents.resolvedDate,
          resolution: safetyIncidents.resolution,
          cost: safetyIncidents.cost,
          createdAt: safetyIncidents.createdAt,
          updatedAt: safetyIncidents.updatedAt,
          // Related data - we'll fetch employee names separately to avoid join conflicts
        })
        .from(safetyIncidents)
        .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
        .orderBy(desc(safetyIncidents.incidentDate))
        .limit(limit)
        .offset(offset);
    } catch (queryError) {
      console.error('Error querying safety incidents:', queryError);
      incidents = [];
    }

    // Fetch employee names separately to avoid join conflicts
    let incidentsWithEmployeeNames = [];
    try {
      incidentsWithEmployeeNames = await Promise.all(
        incidents.map(async (incident) => {
          let reportedByEmployee = null;
          let assignedToEmployee = null;

          try {
            if (incident.reportedBy) {
              reportedByEmployee = await db
                .select({ firstName: employees.firstName, lastName: employees.lastName })
                .from(employees)
                .where(eq(employees.id, incident.reportedBy))
                .limit(1);
            }

            if (incident.assignedToId) {
              assignedToEmployee = await db
                .select({ firstName: employees.firstName, lastName: employees.lastName })
                .from(employees)
                .where(eq(employees.id, incident.assignedToId))
                .limit(1);
            }
          } catch (employeeError) {
            console.error('Error fetching employee names:', employeeError);
          }

          return {
            ...incident,
            reportedByName: reportedByEmployee?.[0]?.firstName || '',
            reportedByLastName: reportedByEmployee?.[0]?.lastName || '',
            assignedToName: assignedToEmployee?.[0]?.firstName || '',
            assignedToLastName: assignedToEmployee?.[0]?.lastName || '',
          };
        })
      );
    } catch (employeeNamesError) {
      console.error('Error processing employee names:', employeeNamesError);
      incidentsWithEmployeeNames = incidents; // Fallback to incidents without employee names
    }

    const lastPage = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: incidentsWithEmployeeNames,
      current_page: page,
      last_page: lastPage,
      per_page: limit,
      total,
      next_page_url: page < lastPage ? `/api/safety-incidents?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/safety-incidents?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching safety incidents:', error);
    return NextResponse.json({ error: 'Failed to fetch safety incidents' }, { status: 500 });
  }
});

export const POST = withPermission(PermissionConfigs.safety.create)(async (request: NextRequest) => {
  try {
    const body = await request.json();
    const {
      title,
      description,
      severity = 'medium',
      status = 'open',
      reportedBy,
      assignedToId,
      location,
      incidentDate,
      resolution,
      cost,
    } = body;

    // Validation
    if (!title) {
      return NextResponse.json({ error: 'Incident title is required' }, { status: 400 });
    }
    if (!reportedBy) {
      return NextResponse.json({ error: 'Reporter is required' }, { status: 400 });
    }
    if (!incidentDate) {
      return NextResponse.json({ error: 'Incident date is required' }, { status: 400 });
    }

    // Verify reporter exists
    const reporter = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.id, parseInt(reportedBy)))
      .limit(1);

    if (reporter.length === 0) {
      return NextResponse.json({ error: 'Reporter not found' }, { status: 404 });
    }

    // Create incident
    const [newIncident] = await db
      .insert(safetyIncidents)
      .values({
        title,
        description,
        severity,
        status,
        reportedBy: parseInt(reportedBy),
        assignedToId: assignedToId ? parseInt(assignedToId) : null,
        location,
        incidentDate: new Date(incidentDate),
        resolution,
        cost: cost ? parseFloat(cost) : null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newIncident,
      message: 'Safety incident created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating safety incident:', error);
    return NextResponse.json({ error: 'Failed to create safety incident' }, { status: 500 });
  }
});
