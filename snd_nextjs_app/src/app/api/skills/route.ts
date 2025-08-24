import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { skills } from '@/lib/drizzle/schema';
import { eq, ilike, and, desc } from 'drizzle-orm';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

// GET /api/skills - Get all skills with filtering and pagination
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

    const offset = (page - 1) * limit;

    // Build filters
    const filters = [];
    if (search) {
      filters.push(ilike(skills.name, `%${search}%`));
    }
    if (category) {
      filters.push(eq(skills.category, category));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Generate cache key based on filters and pagination
    const cacheKey = generateCacheKey('skills', 'list', { page, limit, search, category });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        // Get total count
        const totalResult = await db
          .select({ count: skills.id })
          .from(skills)
          .where(whereClause);
        const total = totalResult.length;

        // Get skills with pagination
        const skillsList = await db
          .select()
          .from(skills)
          .where(whereClause)
          .orderBy(desc(skills.createdAt))
          .limit(limit)
          .offset(offset);

        return NextResponse.json({
          success: true,
          data: skillsList,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        });
      },
      {
        ttl: 600, // 10 minutes
        tags: [CACHE_TAGS.SKILLS],
      }
    );
  } catch (error) {
    console.error('Error fetching skills:', error);
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 });
  }
}

// POST /api/skills - Create a new skill
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, requiredLevel, certificationRequired } = body;

    if (!name) {
      return NextResponse.json({ error: 'Skill name is required' }, { status: 400 });
    }

    const [newSkill] = await db
      .insert(skills)
      .values({
        name,
        description,
        category,
        requiredLevel,
        certificationRequired: certificationRequired || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newSkill,
      message: 'Skill created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating skill:', error);
    return NextResponse.json({ error: 'Failed to create skill' }, { status: 500 });
  }
}
