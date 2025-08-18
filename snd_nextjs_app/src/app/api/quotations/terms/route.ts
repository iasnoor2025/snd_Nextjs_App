import { db } from '@/lib/drizzle';
import { rentals } from '@/lib/drizzle/schema';
import { withPermission } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withPermission(
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { rentalId, terms, notes } = body;

      if (!rentalId) {
        return NextResponse.json({ error: 'Rental ID is required' }, { status: 400 });
      }

      // Update the rental with the new terms
      const updateData: any = {};

      if (terms.generalNotes !== undefined) updateData.notes = terms.generalNotes;
      if (terms.deliveryTerms !== undefined) updateData.deliveryTerms = terms.deliveryTerms;
      if (terms.shipmentTerms !== undefined) updateData.shipmentTerms = terms.shipmentTerms;
      if (terms.rentalTerms !== undefined) updateData.rentalTerms = terms.rentalTerms;
      if (terms.paymentTerms !== undefined) updateData.paymentTerms = terms.paymentTerms;
      if (terms.additionalTerms !== undefined) updateData.additionalTerms = terms.additionalTerms;
      if (terms.mdTerms !== undefined) updateData.mdTerms = terms.mdTerms;

      // Add metadata about the save
      updateData.termsLastUpdated = new Date();
      updateData.termsUpdateNotes = notes || '';

      const result = await db
        .update(rentals)
        .set(updateData)
        .where(eq(rentals.id, rentalId))
        .returning();

      if (result.length === 0) {
        return NextResponse.json({ error: 'Rental not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: 'Terms and conditions saved successfully',
        rental: result[0],
      });
    } catch (error) {
      console.error('Error saving terms and conditions:', error);
      return NextResponse.json({ error: 'Failed to save terms and conditions' }, { status: 500 });
    }
  },
  { action: 'update', subject: 'Rental' }
);
