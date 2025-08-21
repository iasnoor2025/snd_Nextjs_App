import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { safetyIncidents, employees } from '@/lib/drizzle/schema';
import { eq, and, desc, asc, like } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
    const totalCount = await db
      .select({ count: safetyIncidents.id })
      .from(safetyIncidents)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalCount.length;

    // Get incidents with pagination
    const incidents = await db
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
        // Related data
        reportedByName: employees.firstName,
        reportedByLastName: employees.lastName,
        assignedToName: employees.firstName,
        assignedToLastName: employees.lastName,
      })
      .from(safetyIncidents)
      .leftJoin(employees, eq(safetyIncidents.reportedBy, employees.id))
      .leftJoin(employees, eq(safetyIncidents.assignedToId, employees.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(safetyIncidents.incidentDate))
      .limit(limit)
      .offset(offset);

    const lastPage = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: incidents,
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
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
}
