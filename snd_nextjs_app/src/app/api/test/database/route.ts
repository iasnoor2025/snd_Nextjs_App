import { db } from '@/lib/drizzle';
import { rentals } from '@/lib/drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(_request: NextRequest) {
  try {
    // Simple database test without ERPNext
    const rentalsWithInvoices = await db
      .select({
        id: rentals.id,
        rentalNumber: rentals.rentalNumber,
        invoiceId: rentals.invoiceId,
        invoiceDate: rentals.invoiceDate,
        paymentStatus: rentals.paymentStatus,
        outstandingAmount: rentals.outstandingAmount
      })
      .from(rentals)
      .where(sql`${rentals.invoiceId} IS NOT NULL`);
    return NextResponse.json({
      success: true,
      message: `Database query successful - found ${rentalsWithInvoices.length} rentals with invoices`,
      data: {
        rentalsFound: rentalsWithInvoices.length,
        rentals: rentalsWithInvoices.map(r => ({
          id: r.id,
          rentalNumber: r.rentalNumber,
          invoiceId: r.invoiceId
        }))
      }
    });

  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
