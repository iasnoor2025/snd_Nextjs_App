import { db } from '@/lib/drizzle';
import { rentals, rentalItems } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from './erpnext-invoice-service';
import { RentalService } from './rental-service';
import { and, eq, sql } from 'drizzle-orm';

export interface MonthlyInvoicePeriod {
  startDate: Date;
  endDate: Date;
  invoiceNumber: string;
  isFirstMonth: boolean;
}

export interface MonthlyInvoiceData {
  rentalId: number;
  rentalNumber: string;
  customerId: number;
  customerName: string;
  billingPeriod: MonthlyInvoicePeriod;
  items: {
    equipmentId: number;
    equipmentName: string;
    unitPrice: number;
    rateType: string;
    quantity: number;
    totalAmount: number;
  }[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
}

export class AutomatedMonthlyBillingService {
  /**
   * Generate monthly invoices for all active rentals
   */
  static async generateMonthlyInvoicesForAllRentals(): Promise<{
    success: boolean;
    processed: number;
    invoices: any[];
    errors: any[];
  }> {
    const results = {
      success: true,
      processed: 0,
      invoices: [],
      errors: []
    };

    try {
      // Get all active rentals - also include 'approved' status as they might be active
      const activeRentals = await db
        .select()
        .from(rentals)
        .where(sql`${rentals.status} IN ('active', 'approved')`);

            if (activeRentals.length === 0) {
        // Check all rentals to see what statuses exist
        const allRentals = await db
          .select({
            id: rentals.id,
            rentalNumber: rentals.rentalNumber,
            status: rentals.status,
            startDate: rentals.startDate
          })
          .from(rentals);
        
                return {
          success: true,
          processed: 0,
          invoices: [],
          errors: [{
            error: 'No active rentals found',
            details: `Found ${allRentals.length} total rentals with statuses: ${[...new Set(allRentals.map(r => r.status))].join(', ')}`
          }]
        };
      }

      for (const rental of activeRentals) {
        try {
                    const monthlyInvoices = await this.generateMonthlyInvoicesForRental(rental);
          results.invoices.push(...monthlyInvoices);
          results.processed++;
        } catch (error) {
          console.error(`Error processing rental ${rental.id}:`, error);
          results.errors.push({
            rentalId: rental.id,
            rentalNumber: rental.rentalNumber,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in generateMonthlyInvoicesForAllRentals:', error);
      return {
        success: false,
        processed: 0,
        invoices: [],
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }

  /**
   * Generate monthly invoices for a specific rental
   */
  static async generateMonthlyInvoicesForRental(rental: any): Promise<any[]> {
    const invoices = [];

    try {
            // Get rental items
      const items = await RentalService.getRentalItems(rental.id);
      if (!items || items.length === 0) {
        return invoices;
      }

      // Calculate billing periods
      const billingPeriods = this.calculateMonthlyBillingPeriods(rental);
      for (const period of billingPeriods) {
        try {
          const invoiceData = await this.prepareMonthlyInvoiceData(rental, items, period);
          if (invoiceData) {
            const invoice = await this.createMonthlyInvoice(invoiceData);
            invoices.push(invoice);
          }
        } catch (error) {
          console.error(`Error creating invoice for period ${period.startDate} to ${period.endDate}:`, error);
        }
      }

      return invoices;
    } catch (error) {
      console.error(`Error generating monthly invoices for rental ${rental.id}:`, error);
      return invoices;
    }
  }

  /**
   * Calculate monthly billing periods for a rental
   */
  static calculateMonthlyBillingPeriods(rental: any): MonthlyInvoicePeriod[] {
    const periods: MonthlyInvoicePeriod[] = [];
    const rentalStartDate = new Date(rental.startDate);
    const rentalEndDate = rental.expectedEndDate ? new Date(rental.expectedEndDate) : new Date();
    
    // Get the last invoice date for this rental
    const lastInvoiceDate = rental.lastInvoiceDate ? new Date(rental.lastInvoiceDate) : null;
    
    // Determine the start date for billing
    let currentStartDate: Date;
    if (lastInvoiceDate) {
      // Start from the day after the last invoice
      currentStartDate = new Date(lastInvoiceDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
    } else {
      // First invoice - start from rental start date
      currentStartDate = new Date(rentalStartDate);
    }

        // Generate monthly periods
    while (currentStartDate < rentalEndDate) {
      // Calculate the end of the current month
      const monthEndDate = new Date(currentStartDate.getFullYear(), currentStartDate.getMonth() + 1, 0);
      
      // Don't go beyond the rental end date
      const periodEndDate = monthEndDate > rentalEndDate ? rentalEndDate : monthEndDate;
      
      // Skip if period is invalid (start >= end)
      if (currentStartDate >= periodEndDate) {
                break;
      }

      // Generate invoice number
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
      const invoiceNumber = `MONTHLY-${rental.rentalNumber}-${currentStartDate.getFullYear()}-${String(currentStartDate.getMonth() + 1).padStart(2, '0')}-${randomSuffix}`;

      const period = {
        startDate: new Date(currentStartDate),
        endDate: new Date(periodEndDate),
        invoiceNumber,
        isFirstMonth: !lastInvoiceDate
      };

            periods.push(period);

      // Move to the next month
      currentStartDate = new Date(periodEndDate);
      currentStartDate.setDate(currentStartDate.getDate() + 1);
    }
    return periods;
  }

  /**
   * Prepare monthly invoice data for a specific period
   */
  static async prepareMonthlyInvoiceData(
    rental: any, 
    items: any[], 
    period: MonthlyInvoicePeriod
  ): Promise<MonthlyInvoiceData | null> {
    try {
      // Calculate billing amounts for each item
      const billingItems = items.map(item => {
        const daysInPeriod = Math.ceil((period.endDate.getTime() - period.startDate.getTime()) / (1000 * 60 * 60 * 24));
        let totalAmount = 0;

        if (item.rateType === 'daily') {
          totalAmount = item.unitPrice * daysInPeriod;
        } else if (item.rateType === 'weekly') {
          const weeks = Math.ceil(daysInPeriod / 7);
          totalAmount = item.unitPrice * weeks;
        } else if (item.rateType === 'monthly') {
          const months = Math.ceil(daysInPeriod / 30);
          totalAmount = item.unitPrice * months;
        } else {
          // Default to daily
          totalAmount = item.unitPrice * daysInPeriod;
        }

        return {
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          unitPrice: item.unitPrice,
          rateType: item.rateType,
          quantity: 1,
          totalAmount: totalAmount
        };
      });

      const subtotal = billingItems.reduce((sum, item) => sum + item.totalAmount, 0);
      const taxRate = 15; // 15% VAT for KSA
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      return {
        rentalId: rental.id,
        rentalNumber: rental.rentalNumber,
        customerId: rental.customerId,
        customerName: rental.customer?.name || `Customer ${rental.customerId}`,
        billingPeriod: period,
        items: billingItems,
        subtotal,
        taxAmount,
        totalAmount
      };
    } catch (error) {
      console.error(`Error preparing invoice data for period ${period.startDate} to ${period.endDate}:`, error);
      return null;
    }
  }

  /**
   * Create monthly invoice in ERPNext
   */
  static async createMonthlyInvoice(invoiceData: MonthlyInvoiceData): Promise<any> {
    try {
      // Prepare rental data for ERPNext invoice creation
      const rentalData = {
        id: invoiceData.rentalId,
        rentalNumber: invoiceData.rentalNumber,
        customerId: invoiceData.customerId,
        customer: {
          name: invoiceData.customerName
        },
        totalAmount: invoiceData.totalAmount.toString(),
        subtotal: invoiceData.subtotal.toString(),
        taxAmount: invoiceData.taxAmount.toString(),
        paymentTermsDays: 30
      };

      // Create invoice in ERPNext using existing method
      const erpnextInvoice = await ERPNextInvoiceService.createRentalInvoice(
        rentalData, 
        invoiceData.billingPeriod.invoiceNumber
      );

      // Update rental with monthly invoice information
      await db
        .update(rentals)
        .set({
          lastInvoiceDate: invoiceData.billingPeriod.endDate.toISOString().split('T')[0],
          lastInvoiceId: erpnextInvoice.name || invoiceData.billingPeriod.invoiceNumber,
          lastInvoiceAmount: invoiceData.totalAmount.toString(),
          outstandingAmount: invoiceData.totalAmount.toString(),
          lastErpNextSync: new Date().toISOString(),
          updatedAt: new Date().toISOString().split('T')[0]
        })
        .where(eq(rentals.id, invoiceData.rentalId));

            return {
        rentalId: invoiceData.rentalId,
        rentalNumber: invoiceData.rentalNumber,
        invoiceNumber: erpnextInvoice.name || invoiceData.billingPeriod.invoiceNumber,
        totalAmount: invoiceData.totalAmount,
        billingPeriod: invoiceData.billingPeriod,
        erpnextInvoice: erpnextInvoice
      };
    } catch (error) {
      console.error(`Error creating monthly invoice for rental ${invoiceData.rentalId}:`, error);
      throw error;
    }
  }
}
