import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeePerformanceReviews } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';

// PUT /api/performance-reviews/[id] - Update a performance review
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reviewId } = await params;
    const body = await request.json();
    const { reviewDate, rating, comments, goals, status } = body;

    if (!reviewDate) {
      return NextResponse.json({ error: 'Review date is required' }, { status: 400 });
    }

    const [updatedReview] = await db
      .update(employeePerformanceReviews)
      .set({
        reviewDate: new Date(reviewDate),
        rating: rating ? parseInt(rating) : null,
        comments,
        goals,
        status,
        updatedAt: new Date(),
      })
      .where(eq(employeePerformanceReviews.id, parseInt(reviewId)))
      .returning();

    if (!updatedReview) {
      return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedReview,
      message: 'Performance review updated successfully'
    });
  } catch (error) {
    console.error('Error updating performance review:', error);
    return NextResponse.json({ error: 'Failed to update performance review' }, { status: 500 });
  }
}

// DELETE /api/performance-reviews/[id] - Delete a performance review
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: reviewId } = await params;

    const [deletedReview] = await db
      .delete(employeePerformanceReviews)
      .where(eq(employeePerformanceReviews.id, parseInt(reviewId)))
      .returning();

    if (!deletedReview) {
      return NextResponse.json({ error: 'Performance review not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Performance review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting performance review:', error);
    return NextResponse.json({ error: 'Failed to delete performance review' }, { status: 500 });
  }
}
