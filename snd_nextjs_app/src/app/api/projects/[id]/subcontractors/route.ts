import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectSubcontractors, projects, employees } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    // Build where conditions
    const whereConditions = [eq(projectSubcontractors.projectId, parseInt(projectId))];
    
    if (status && status !== 'all') {
      whereConditions.push(eq(projectSubcontractors.status, status));
    }

    // Fetch subcontractors with related data
    const subcontractors = await db
      .select({
        id: projectSubcontractors.id,
        projectId: projectSubcontractors.projectId,
        companyName: projectSubcontractors.companyName,
        contactPerson: projectSubcontractors.contactPerson,
        phone: projectSubcontractors.phone,
        email: projectSubcontractors.email,
        scopeOfWork: projectSubcontractors.scopeOfWork,
        contractValue: projectSubcontractors.contractValue,
        startDate: projectSubcontractors.startDate,
        endDate: projectSubcontractors.endDate,
        status: projectSubcontractors.status,
        paymentTerms: projectSubcontractors.paymentTerms,
        notes: projectSubcontractors.notes,
        assignedBy: projectSubcontractors.assignedBy,
        createdAt: projectSubcontractors.createdAt,
        updatedAt: projectSubcontractors.updatedAt,
        assignedByName: employees.firstName,
        assignedByLastName: employees.lastName,
      })
      .from(projectSubcontractors)
      .leftJoin(employees, eq(projectSubcontractors.assignedBy, employees.id))
      .where(and(...whereConditions))
      .orderBy(desc(projectSubcontractors.createdAt));

    return NextResponse.json({ 
      success: true,
      data: subcontractors 
    });
  } catch (error) {
    console.error('Error fetching project subcontractors:', error);
    return NextResponse.json({ error: 'Failed to fetch project subcontractors' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      companyName,
      contactPerson,
      phone,
      email,
      scopeOfWork,
      contractValue,
      startDate,
      endDate,
      paymentTerms,
      notes,
    } = body;

    // Validation
    if (!companyName || !scopeOfWork || !startDate) {
      return NextResponse.json({ error: 'Company name, scope of work, and start date are required' }, { status: 400 });
    }

    // Create subcontractor
    const [newSubcontractor] = await db
      .insert(projectSubcontractors)
      .values({
        projectId: parseInt(projectId),
        companyName,
        contactPerson,
        phone,
        email,
        scopeOfWork,
        contractValue: contractValue ? parseFloat(contractValue) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        paymentTerms,
        notes,
        status: 'active',
        assignedBy: session.user.id ? parseInt(session.user.id) : null,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({ 
      success: true,
      data: newSubcontractor,
      message: 'Subcontractor added successfully' 
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding subcontractor:', error);
    return NextResponse.json({ error: 'Failed to add subcontractor' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get subcontractor ID from query params
    const { searchParams } = new URL(request.url);
    const subcontractorId = searchParams.get('id');

    if (!subcontractorId || isNaN(parseInt(subcontractorId))) {
      return NextResponse.json({ error: 'Invalid subcontractor ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify subcontractor exists
    const existingSubcontractor = await db
      .select({ id: projectSubcontractors.id })
      .from(projectSubcontractors)
      .where(and(
        eq(projectSubcontractors.id, parseInt(subcontractorId)),
        eq(projectSubcontractors.projectId, parseInt(projectId))
      ))
      .limit(1);

    if (existingSubcontractor.length === 0) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    const body = await request.json();
    const {
      companyName,
      contactPerson,
      phone,
      email,
      scopeOfWork,
      contractValue,
      startDate,
      endDate,
      status,
      paymentTerms,
      notes,
    } = body;

    // Validation
    if (!companyName || !scopeOfWork || !startDate) {
      return NextResponse.json({ error: 'Company name, scope of work, and start date are required' }, { status: 400 });
    }

    // Update subcontractor
    const [updatedSubcontractor] = await db
      .update(projectSubcontractors)
      .set({
        companyName,
        contactPerson,
        phone,
        email,
        scopeOfWork,
        contractValue: contractValue ? parseFloat(contractValue) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        status: status || 'active',
        paymentTerms,
        notes,
        updatedAt: new Date(),
      })
      .where(eq(projectSubcontractors.id, parseInt(subcontractorId)))
      .returning();

    return NextResponse.json({ 
      success: true,
      data: updatedSubcontractor,
      message: 'Subcontractor updated successfully' 
    });
  } catch (error) {
    console.error('Error updating subcontractor:', error);
    return NextResponse.json({ error: 'Failed to update subcontractor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: projectId } = await params;

    // Validate projectId
    if (!projectId || isNaN(parseInt(projectId))) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Get subcontractor ID from query params
    const { searchParams } = new URL(request.url);
    const subcontractorId = searchParams.get('id');

    if (!subcontractorId || isNaN(parseInt(subcontractorId))) {
      return NextResponse.json({ error: 'Invalid subcontractor ID' }, { status: 400 });
    }

    // Verify project exists
    const project = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.id, parseInt(projectId)))
      .limit(1);

    if (project.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Verify subcontractor exists
    const existingSubcontractor = await db
      .select({ id: projectSubcontractors.id })
      .from(projectSubcontractors)
      .where(and(
        eq(projectSubcontractors.id, parseInt(subcontractorId)),
        eq(projectSubcontractors.projectId, parseInt(projectId))
      ))
      .limit(1);

    if (existingSubcontractor.length === 0) {
      return NextResponse.json({ error: 'Subcontractor not found' }, { status: 404 });
    }

    // Delete subcontractor
    await db
      .delete(projectSubcontractors)
      .where(eq(projectSubcontractors.id, parseInt(subcontractorId)));

    return NextResponse.json({ 
      success: true,
      message: 'Subcontractor deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting subcontractor:', error);
    return NextResponse.json({ error: 'Failed to delete subcontractor' }, { status: 500 });
  }
}
