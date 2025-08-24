import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { trainings } from '@/lib/drizzle/schema';
import { eq, ilike, and, desc } from 'drizzle-orm';
import { cacheQueryResult, generateCacheKey, CACHE_TAGS } from '@/lib/redis';

// GET /api/trainings - Get all training programs with filtering and pagination
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
    const status = searchParams.get('status') || '';

    const offset = (page - 1) * limit;

    // Build filters
    const filters = [];
    if (search) {
      filters.push(ilike(trainings.name, `%${search}%`));
    }
    if (category) {
      filters.push(eq(trainings.category, category));
    }
    if (status) {
      filters.push(eq(trainings.status, status));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Generate cache key based on filters and pagination
    const cacheKey = generateCacheKey('trainings', 'list', { page, limit, search, category, status });
    
    return await cacheQueryResult(
      cacheKey,
      async () => {
        // Get total count
        const totalResult = await db
          .select({ count: trainings.id })
          .from(trainings)
          .where(whereClause);
        const total = totalResult.length;

        // Get trainings with pagination
        const trainingsList = await db
          .select()
          .from(trainings)
          .where(whereClause)
          .orderBy(desc(trainings.createdAt))
          .limit(limit)
          .offset(offset);

        return NextResponse.json({
          success: true,
          data: trainingsList,
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
        tags: [CACHE_TAGS.TRAININGS],
      }
    );
  } catch (error) {
    console.error('Error fetching trainings:', error);
    return NextResponse.json({ error: 'Failed to fetch trainings' }, { status: 500 });
  }
}

// POST /api/trainings - Create a new training program
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
      duration, 
      provider, 
      cost, 
      maxParticipants,
      prerequisites,
      objectives,
      materials,
      status = 'active'
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Training name is required' }, { status: 400 });
    }

    const [newTraining] = await db
      .insert(trainings)
      .values({
        name,
        description,
        category,
        duration,
        provider,
        cost: cost ? parseFloat(cost) : null,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        prerequisites,
        objectives,
        materials,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newTraining,
      message: 'Training program created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating training:', error);
    return NextResponse.json({ error: 'Failed to create training' }, { status: 500 });
  }
}
