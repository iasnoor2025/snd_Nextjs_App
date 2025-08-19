import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { projectTemplates, users } from '@/lib/drizzle/schema';
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
    const category = searchParams.get('category') || '';
    const complexity = searchParams.get('complexity') || '';
    const isActive = searchParams.get('is_active');

    const offset = (page - 1) * limit;

    // Build where conditions
    let whereConditions = [];
    
    if (search) {
      whereConditions.push(
        like(projectTemplates.name, `%${search}%`)
      );
    }
    
    if (category && category !== 'all') {
      whereConditions.push(eq(projectTemplates.category, category));
    }
    
    if (complexity && complexity !== 'all') {
      whereConditions.push(eq(projectTemplates.complexity, complexity));
    }
    
    if (isActive !== null && isActive !== undefined) {
      whereConditions.push(eq(projectTemplates.isActive, isActive === 'true'));
    }

    // Get total count
    const totalCount = await db
      .select({ count: projectTemplates.id })
      .from(projectTemplates)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined);

    const total = totalCount.length;

    // Get templates with pagination
    const templates = await db
      .select({
        id: projectTemplates.id,
        name: projectTemplates.name,
        description: projectTemplates.description,
        category: projectTemplates.category,
        estimatedDuration: projectTemplates.estimatedDuration,
        estimatedBudget: projectTemplates.estimatedBudget,
        complexity: projectTemplates.complexity,
        teamSize: projectTemplates.teamSize,
        isActive: projectTemplates.isActive,
        createdAt: projectTemplates.createdAt,
        updatedAt: projectTemplates.updatedAt,
        createdByName: users.name,
      })
      .from(projectTemplates)
      .leftJoin(users, eq(projectTemplates.createdBy, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(projectTemplates.createdAt))
      .limit(limit)
      .offset(offset);

    const lastPage = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: templates,
      current_page: page,
      last_page: lastPage,
      per_page: limit,
      total,
      next_page_url: page < lastPage ? `/api/project-templates?page=${page + 1}` : null,
      prev_page_url: page > 1 ? `/api/project-templates?page=${page - 1}` : null,
    });
  } catch (error) {
    console.error('Error fetching project templates:', error);
    return NextResponse.json({ error: 'Failed to fetch project templates' }, { status: 500 });
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
      name,
      description,
      category,
      estimatedDuration,
      estimatedBudget,
      complexity = 'medium',
      teamSize,
    } = body;

    // Validation
    if (!name) {
      return NextResponse.json({ error: 'Template name is required' }, { status: 400 });
    }
    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 });
    }

    // Create template
    const [newTemplate] = await db
      .insert(projectTemplates)
      .values({
        name,
        description,
        category,
        estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
        estimatedBudget: estimatedBudget ? parseFloat(estimatedBudget) : null,
        complexity,
        teamSize: teamSize ? parseInt(teamSize) : null,
        createdBy: session.user.id,
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newTemplate,
      message: 'Project template created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating project template:', error);
    return NextResponse.json({ error: 'Failed to create project template' }, { status: 500 });
  }
}
