import { db } from '@/lib/drizzle';
import { customers, rentals } from '@/lib/drizzle/schema';
import { eq, sql, count, sum } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { ERPNextClient } from '@/lib/erpnext-client';

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const customerId = parseInt(id);
    if (isNaN(customerId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid customer ID',
        },
        { status: 400 }
      );
    }

    // Fetch customer details
    const customer = await db
      .select()
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Customer not found',
        },
        { status: 404 }
      );
    }
    // Get rental statistics for this customer
    const rentalStats = await db
      .select({
        totalRentals: count(),
        totalRentalValue: sum(sql`COALESCE(${rentals.totalAmount}, 0)`),
        totalFinalAmount: sum(sql`COALESCE(${rentals.finalAmount}, 0)`),
      })
      .from(rentals)
      .where(eq(rentals.customerId, customerId));

    // Get rentals list
    const customerRentals = await db
      .select()
      .from(rentals)
      .where(eq(rentals.customerId, customerId));
    // Calculate outstanding amount (sum of unpaid rentals)
    const outstandingRentals = customerRentals.filter(
      rental => rental.paymentStatus !== 'paid' && rental.status === 'active'
    );
    const outstandingAmount = outstandingRentals.reduce(
      (total, rental) => total + (parseFloat(rental.finalAmount || '0') || 0),
      0
    );
    // Calculate total paid amount
    const paidRentals = customerRentals.filter(rental => rental.paymentStatus === 'paid');
    const totalPaid = paidRentals.reduce(
      (total, rental) => total + (parseFloat(rental.finalAmount || '0') || 0),
      0
    );

    // Get invoices count (using rental_invoices table)
    let invoiceCount = 0;
    let totalInvoiced = 0;
    try {
      // Try to get invoices from rental_invoices
      const invoiceResult = await db.execute(sql`
        SELECT COUNT(*) as count, COALESCE(SUM(amount::numeric), 0) as total
        FROM rental_invoices ri
        INNER JOIN rentals r ON ri.rental_id = r.id
        WHERE r.customer_id = ${customerId}
      `);

      if (invoiceResult.rows && invoiceResult.rows.length > 0) {
        invoiceCount = parseInt(invoiceResult.rows[0].count || '0', 10);
        totalInvoiced = parseFloat(invoiceResult.rows[0].total || '0');
      }
    } catch (error) {
      console.warn('Could not fetch invoice count:', error);
    }

    const stats = {
      customerId,
      customerName: customer[0].name,
      // Rental Stats
      totalRentals: rentalStats[0]?.totalRentals || 0,
      totalRentalValue: parseFloat(rentalStats[0]?.totalRentalValue || '0'),
      totalFinalAmount: parseFloat(rentalStats[0]?.totalFinalAmount || '0'),
      // Invoice Stats
      totalInvoices: invoiceCount,
      totalInvoiced: totalInvoiced,
      // Financial Stats
      outstandingAmount: outstandingAmount,
      totalPaid: totalPaid,
      currentDue: outstandingAmount,
      totalValue: parseFloat(rentalStats[0]?.totalRentalValue || '0') || parseFloat(customer[0].totalValue || '0'),
      // Credit Information
      creditLimit: parseFloat(customer[0].creditLimit || '0'),
      creditLimitUsed: outstandingAmount,
      creditLimitRemaining:
        parseFloat(customer[0].creditLimit || '0') - outstandingAmount,
      currency: customer[0].currency || 'SAR',
      status: customer[0].status,
    };
    // Fetch ERPNext financial data if customer has erpnextId
    let erpnextFinancialData = null;
    if (customer[0].erpnextId) {
      try {
        const erpnextClient = new ERPNextClient();
        erpnextFinancialData = await erpnextClient.getCustomerFinancialData(customer[0].erpnextId);
        
        if (erpnextFinancialData) {
          // Merge ERPNext data with local stats
          // ERPNext data takes precedence for invoices and outstanding
          stats.totalInvoices = Math.max(stats.totalInvoices, erpnextFinancialData.totalInvoices || 0);
          stats.totalInvoiced = Math.max(stats.totalInvoiced, erpnextFinancialData.totalInvoiced || 0);
          stats.outstandingAmount = Math.max(stats.outstandingAmount, erpnextFinancialData.outstandingAmount || 0);
          stats.currentDue = Math.max(stats.currentDue, erpnextFinancialData.currentDue || 0);
          stats.creditLimit = Math.max(stats.creditLimit, erpnextFinancialData.creditLimit || 0);
          stats.creditLimitUsed = erpnextFinancialData.creditLimitUsed || stats.outstandingAmount;
          
          // Update total value from ERPNext if available
          if (erpnextFinancialData.totalValue && erpnextFinancialData.totalValue > 0) {
            stats.totalValue = erpnextFinancialData.totalValue;
          }
          
          // Update credit limit remaining
          stats.creditLimitRemaining = stats.creditLimit - stats.creditLimitUsed;
        }
      } catch (erpnextError) {
        console.warn('⚠️ Could not fetch ERPNext financial data:', erpnextError);
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      rentals: customerRentals,
      erpnextFinancialData,
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch customer statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
