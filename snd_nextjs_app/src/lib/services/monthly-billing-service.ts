import { db } from '@/lib/db';
import { rentals, rentalItems } from '@/lib/drizzle/schema';
import { ERPNextInvoiceService } from './erpnext-invoice-service';
import { RentalService } from './rental-service';
import { and, eq, gte, lte, sql } from 'drizzle-orm';

export interface MonthlyBillingData {
  rentalId: number;
  rentalNumber: string;
  customerId: number;
  customerName: string;
  billingPeriod: {
    startDate: string;
    endDate: string;
  };
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
  invoiceNumber: string;
}

export class MonthlyBillingService {
  /**
   * Generate monthly invoices for all active rentals
   */
  static async generateMonthlyInvoices(): Promise<{
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
      // Get all active rentals
      const activeRentals = await db
        .select()
        .from(rentals)
        .where(eq(rentals.status, 'active'));

      for (const rental of activeRentals) {
        try {
          const billingData = await this.prepareMonthlyBilling(rental);
          if (billingData) {
            const invoice = await this.createMonthlyInvoice(billingData);
            results.invoices.push(invoice);
            results.processed++;
          }
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
      console.error('Error in generateMonthlyInvoices:', error);
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
   * Prepare monthly billing data for a specific rental
   */
  static async prepareMonthlyBilling(rental: any): Promise<MonthlyBillingData | null> {
    try {
      // Get rental items
      const items = await RentalService.getRentalItems(rental.id);

      if (!items || items.length === 0) {
        console.log(`No rental items found for rental ${rental.id}`);
        return null;
      }

      // Calculate billing period (last month)
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // Adjust billing period based on rental dates
      const rentalStartDate = new Date(rental.startDate);
      const rentalEndDate = rental.expectedEndDate ? new Date(rental.expectedEndDate) : now;

      const billingStartDate = rentalStartDate > lastMonth ? rentalStartDate : lastMonth;
      const billingEndDate = rentalEndDate < endOfLastMonth ? rentalEndDate : endOfLastMonth;

      // Skip if billing period is invalid
      if (billingStartDate >= billingEndDate) {
        console.log(`Invalid billing period for rental ${rental.id}`);
        return null;
      }

      // Calculate billing amounts for each item
      const billingItems = items.map(item => {
        const daysInPeriod = Math.ceil((billingEndDate.getTime() - billingStartDate.getTime()) / (1000 * 60 * 60 * 24));
        let totalAmount = 0;

        if (item.rateType === 'daily') {
          const unitPriceNum = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
          totalAmount = unitPriceNum * daysInPeriod;
        } else if (item.rateType === 'weekly') {
          const weeks = Math.ceil(daysInPeriod / 7);
          const unitPriceNum = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
          totalAmount = unitPriceNum * weeks;
        } else if (item.rateType === 'monthly') {
          const months = Math.ceil(daysInPeriod / 30);
          const unitPriceNum = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
          totalAmount = unitPriceNum * months;
        } else {
          // Default to daily
          const unitPriceNum = typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice;
          totalAmount = unitPriceNum * daysInPeriod;
        }

        return {
          equipmentId: item.equipmentId,
          equipmentName: item.equipmentName,
          unitPrice: typeof item.unitPrice === 'string' ? parseFloat(item.unitPrice) : item.unitPrice,
          rateType: item.rateType,
          quantity: 1,
          totalAmount: totalAmount
        };
      });

      const subtotal = billingItems.reduce((sum, item) => sum + item.totalAmount, 0);
      const taxRate = 15; // 15% VAT for KSA
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;

      // Generate invoice number
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substr(2, 3).toUpperCase();
      const invoiceNumber = `MONTHLY-${rental.rentalNumber}-${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}-${randomSuffix}`;

      return {
        rentalId: rental.id,
        rentalNumber: rental.rentalNumber,
        customerId: rental.customerId,
        customerName: rental.customerName || `Customer ${rental.customerId}`,
        billingPeriod: {
          startDate: billingStartDate.toISOString().split('T')[0],
          endDate: billingEndDate.toISOString().split('T')[0]
        },
        items: billingItems,
        subtotal,
        taxAmount,
        totalAmount,
        invoiceNumber
      };
    } catch (error) {
      console.error(`Error preparing billing for rental ${rental.id}:`, error);
      return null;
    }
  }

  /**
   * Create monthly invoice in ERPNext
   */
  static async createMonthlyInvoice(billingData: MonthlyBillingData): Promise<any> {
    try {
      // Prepare ERPNext invoice data
      const invoiceData = {
        customer: billingData.customerId.toString(),
        customer_name: billingData.customerName,
        posting_date: new Date().toISOString().split('T')[0],
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        items: billingData.items.map(item => ({
          item_code: `EQUIPMENT-${item.equipmentId}`,
          item_name: item.equipmentName,
          description: `Monthly rental for ${item.equipmentName} (${billingData.billingPeriod.startDate} to ${billingData.billingPeriod.endDate})`,
          qty: item.quantity,
          rate: item.unitPrice,
          amount: item.totalAmount,
          uom: item.rateType === 'daily' ? 'Day' : item.rateType === 'weekly' ? 'Week' : 'Month',
          income_account: 'Rental Income - Assets'
        })),
        taxes_and_charges: 'VAT 15%',
        tax_category: 'VAT',
        company: 'SND Rental Company',
        currency: 'SAR',
        conversion_rate: 1,
        selling_price_list: 'Standard Selling',
        price_list_currency: 'SAR',
        plc_conversion_rate: 1,
        ignore_pricing_rule: 0,
        apply_discount_on: 'Grand Total',
        base_discount_amount: 0,
        additional_discount_percentage: 0,
        discount_amount: 0,
        base_grand_total: billingData.totalAmount,
        base_rounding_adjustment: 0,
        base_rounded_total: billingData.totalAmount,
        base_total: billingData.subtotal,
        base_total_taxes_and_charges: billingData.taxAmount,
        grand_total: billingData.totalAmount,
        rounded_total: billingData.totalAmount,
        total: billingData.subtotal,
        total_taxes_and_charges: billingData.taxAmount,
        outstanding_amount: billingData.totalAmount,
        disable_rounded_total: 0,
        apply_shipping_rule: 0,
        shipping_rule: null,
        shipping_address: null,
        customer_address: null,
        contact_person: null,
        territory: 'Saudi Arabia',
        set_warehouse: null,
        update_stock: 0,
        scan_barcode: null,
        is_pos: 0,
        is_return: 0,
        is_debit_note: 0,
        is_internal_customer: 0,
        is_consolidated: 0,
        is_inter_company_invoice: 0,
        inter_company_invoice_reference: null,
        repost_required: 0,
        auto_repeat: null,
        from_date: null,
        to_date: null,
        letter_head: null,
        group_same_items: 0,
        language: 'en',
        select_print_heading: null,
        inter_company_order_reference: null,
        is_opening: 'No',
        remarks: `Monthly billing for rental ${billingData.rentalNumber} - Period: ${billingData.billingPeriod.startDate} to ${billingData.billingPeriod.endDate}`,
        against_income_account: 'Rental Income - Assets',
        project: null,
        cost_center: null,
        po_no: null,
        po_date: null,
        customer_po_no: null,
        customer_po_date: null,
        delivery_note_no: null,
        delivery_note_date: null,
        sales_person: null,
        commission_rate: 0,
        total_commission: 0,
        from_warehouse: null,
        source: null,
        campaign: null,
        is_internal_supplier: 0,
        supplier: null,
        supplier_name: null,
        supplier_address: null,
        address_display: null,
        contact_display: null,
        contact_mobile: null,
        contact_email: null,
        shipping_address_name: null,
        customer_address_name: null,
        contact_person_name: null,
        contact_display_name: null,
        contact_mobile_display: null,
        contact_email_display: null,
        shipping_address_display: null,
        customer_address_display: null,
        contact_person_display: null,
        doctype: 'Sales Invoice'
      };

      // Create invoice in ERPNext
      // TODO: ERPNextInvoiceService.createInvoice method needs to be implemented
      const erpnextInvoice = { name: billingData.invoiceNumber }; // Placeholder
      // const erpnextInvoice = await ERPNextInvoiceService.createInvoice(invoiceData);

      // Update rental with monthly invoice information
      await db
        .update(rentals)
        .set({
          invoiceId: erpnextInvoice.name || billingData.invoiceNumber,
          invoiceDate: new Date().toISOString().split('T')[0],
          paymentDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          paymentStatus: 'pending',
          outstandingAmount: billingData.totalAmount.toString(),
          updatedAt: new Date().toISOString().split('T')[0]
        })
        .where(eq(rentals.id, billingData.rentalId));

      return {
        rentalId: billingData.rentalId,
        rentalNumber: billingData.rentalNumber,
        invoiceNumber: erpnextInvoice.name || billingData.invoiceNumber,
        totalAmount: billingData.totalAmount,
        billingPeriod: billingData.billingPeriod,
        erpnextInvoice: erpnextInvoice
      };
    } catch (error) {
      console.error(`Error creating monthly invoice for rental ${billingData.rentalId}:`, error);
      throw error;
    }
  }

  /**
   * Sync payment status from ERPNext for all rentals
   */
  static async syncPaymentStatus(): Promise<{
    success: boolean;
    synced: number;
    errors: any[];
  }> {
    const results = {
      success: true,
      synced: 0,
      errors: []
    };

    try {
      // Get all rentals with invoices
      const rentalsWithInvoices = await db
        .select()
        .from(rentals)
        .where(and(
          eq(rentals.status, 'active'),
          sql`${rentals.invoiceId} IS NOT NULL`
        ));

      for (const rental of rentalsWithInvoices) {
        try {
          if (rental.invoiceId) {
            const invoiceDetails = await ERPNextInvoiceService.getInvoice(rental.invoiceId);

            if (invoiceDetails && !invoiceDetails.error) {
              const paymentStatus = invoiceDetails.outstanding_amount === 0 ? 'paid' : 'pending';
              const outstandingAmount = invoiceDetails.outstanding_amount || 0;

              await db
                .update(rentals)
                .set({
                  paymentStatus: paymentStatus,
                  outstandingAmount: outstandingAmount.toString(),
                  updatedAt: new Date().toISOString().split('T')[0]
                })
                .where(eq(rentals.id, rental.id));

              results.synced++;
            }
          }
        } catch (error) {
          console.error(`Error syncing payment for rental ${rental.id}:`, error);
          results.errors.push({
            rentalId: rental.id,
            rentalNumber: rental.rentalNumber,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Error in syncPaymentStatus:', error);
      return {
        success: false,
        synced: 0,
        errors: [{
          error: error instanceof Error ? error.message : 'Unknown error'
        }]
      };
    }
  }
}
