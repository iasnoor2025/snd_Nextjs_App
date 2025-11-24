import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectTemplates, projects, customers } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from '@/lib/auth';


export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: templateId } = await params;

    // Validate templateId
    if (!templateId || isNaN(parseInt(templateId))) {
      return NextResponse.json({ error: 'Invalid template ID' }, { status: 400 });
    }

    // Get template
    const template = await db
      .select()
      .from(projectTemplates)
      .where(eq(projectTemplates.id, parseInt(templateId)))
      .limit(1);

    if (template.length === 0) {
      return NextResponse.json({ error: 'Project template not found' }, { status: 404 });
    }

    const selectedTemplate = template[0];

    // Get request body
    const body = await request.json();
    const {
      name,
      description,
      customerId,
      startDate,
      endDate,
      budget,
      notes,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Verify customer exists if provided
    if (customerId) {
      const customer = await db
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.id, parseInt(customerId)))
        .limit(1);

      if (customer.length === 0) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
      }
    }

    // Create project from template
    const [newProject] = await db
      .insert(projects)
      .values({
        name,
        description: description || selectedTemplate.description,
        customerId: customerId ? parseInt(customerId) : null,
        startDate: startDate ? new Date(startDate).toISOString().split('T')[0] : null,
        endDate: endDate ? new Date(endDate).toISOString().split('T')[0] : null,
        budget: budget || selectedTemplate.estimatedBudget,
        notes: notes || `Created from template: ${selectedTemplate.name}`,
        status: 'active',
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        id: newProject.id,
        name: newProject.name,
        templateUsed: selectedTemplate.name,
        message: 'Project created successfully from template'
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project from template:', error);
    return NextResponse.json({ error: 'Failed to create project from template' }, { status: 500 });
  }
}
