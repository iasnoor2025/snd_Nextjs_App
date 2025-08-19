import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeePerformanceReviews, employees, users } from '@/lib/drizzle/schema';
import { eq, ilike, and, desc } from 'drizzle-orm';

// GET /api/performance-reviews - Get all performance reviews with filtering and pagination
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
    const status = searchParams.get('status') || '';
    const rating = searchParams.get('rating') || '';

    const offset = (page - 1) * limit;

    // Build filters
    const filters = [];
    if (search) {
      // Search in employee names
      filters.push(
        and(
          ilike(employees.firstName, `%${search}%`),
          ilike(employees.lastName, `%${search}%`)
        )
      );
    }
    if (status) {
      filters.push(eq(employeePerformanceReviews.status, status));
    }
    if (rating) {
      filters.push(eq(employeePerformanceReviews.rating, parseInt(rating)));
    }

    const whereClause = filters.length > 0 ? and(...filters) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: employeePerformanceReviews.id })
      .from(employeePerformanceReviews)
      .innerJoin(employees, eq(employeePerformanceReviews.employeeId, employees.id))
      .where(whereClause);
    const total = totalResult.length;

    // Get reviews with pagination
    const reviews = await db
      .select({
        id: employeePerformanceReviews.id,
        reviewDate: employeePerformanceReviews.reviewDate,
        rating: employeePerformanceReviews.rating,
        comments: employeePerformanceReviews.comments,
        goals: employeePerformanceReviews.goals,
        status: employeePerformanceReviews.status,
        createdAt: employeePerformanceReviews.createdAt,
        updatedAt: employeePerformanceReviews.updatedAt,
        employee: {
          id: employees.id,
          firstName: employees.firstName,
          lastName: employees.lastName,
          email: employees.email,
        },
        reviewer: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(employeePerformanceReviews)
      .innerJoin(employees, eq(employeePerformanceReviews.employeeId, employees.id))
      .leftJoin(users, eq(employeePerformanceReviews.reviewerId, users.id))
      .where(whereClause)
      .orderBy(desc(employeePerformanceReviews.reviewDate))
      .limit(limit)
      .offset(offset);

    return NextResponse.json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch performance reviews' }, { status: 500 });
  }
}

// POST /api/performance-reviews - Create a new performance review
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { employeeId, reviewDate, rating, comments, goals, status = 'pending' } = body;

    if (!employeeId || !reviewDate) {
      return NextResponse.json({ error: 'Employee ID and review date are required' }, { status: 400 });
    }

    // Check if employee exists
    const employee = await db
      .select()
      .from(employees)
      .where(eq(employees.id, parseInt(employeeId)))
      .limit(1);

    if (employee.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const [newReview] = await db
      .insert(employeePerformanceReviews)
      .values({
        employeeId: parseInt(employeeId),
        reviewDate: new Date(reviewDate),
        reviewerId: session.user.id ? parseInt(session.user.id) : null,
        rating: rating ? parseInt(rating) : null,
        comments,
        goals,
        status,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: newReview,
      message: 'Performance review created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating performance review:', error);
    return NextResponse.json({ error: 'Failed to create performance review' }, { status: 500 });
  }
}
