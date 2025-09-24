import { db } from '@/lib/drizzle';
import { rentals } from '@/lib/drizzle/schema';
import { RentalService } from '@/lib/services/rental-service';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';

// PUT /api/rentals/[id]/activate - Activate rental and sync all assignments
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: rentalId } = await params;
    const id = parseInt(rentalId);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid rental ID' }, { status: 400 });
    }

    // Get current rental
    const rental = await RentalService.getRental(id);
    if (!rental) {
      return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
    }

    // Check if rental has placeholder startDate and update it to today if activating
    const updateData: any = {
      status: 'active',
      updatedAt: new Date().toISOString().split('T')[0],
    };

    // If startDate is the placeholder (Dec 31, 2099), update to today's date
    if (rental.startDate === '2099-12-31') {
      updateData.startDate = new Date().toISOString().split('T')[0];
    }

    // Update rental status to active
    await db
      .update(rentals)
      .set(updateData)
      .where(eq(rentals.id, id));

    // Create/update automatic assignments with rental dates (this now handles both create and update)
    await RentalService.createAutomaticAssignments(id);

    return NextResponse.json({
      success: true,
      message: 'Rental activated and all assignments synchronized with rental dates',
      data: {
        rentalId: id,
        status: 'active',
        assignmentsSynced: true,
      },
    });
  } catch (error) {
    console.error('Error activating rental:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to activate rental',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}