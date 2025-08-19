import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeePerformanceReviews, employees, users } from '@/lib/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/employee/[id]/performance-reviews - Get employee performance reviews
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;

    const performanceReviews = await db
      .select({
        id: employeePerformanceReviews.id,
        reviewDate: employeePerformanceReviews.reviewDate,
        rating: employeePerformanceReviews.rating,
        comments: employeePerformanceReviews.comments,
        goals: employeePerformanceReviews.goals,
        status: employeePerformanceReviews.status,
        createdAt: employeePerformanceReviews.createdAt,
        updatedAt: employeePerformanceReviews.updatedAt,
        reviewer: {
          id: users.id,
          name: users.name,
          email: users.email,
        }
      })
      .from(employeePerformanceReviews)
      .leftJoin(users, eq(employeePerformanceReviews.reviewerId, users.id))
      .where(eq(employeePerformanceReviews.employeeId, parseInt(employeeId)))
      .orderBy(desc(employeePerformanceReviews.reviewDate));

    return NextResponse.json({
      success: true,
      data: performanceReviews
    });
  } catch (error) {
    console.error('Error fetching performance reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch performance reviews' }, { status: 500 });
  }
}

// POST /api/employee/[id]/performance-reviews - Create performance review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId } = await params;
    const body = await request.json();
    const { reviewDate, rating, comments, goals, status = 'pending' } = body;

    if (!reviewDate) {
      return NextResponse.json({ error: 'Review date is required' }, { status: 400 });
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
