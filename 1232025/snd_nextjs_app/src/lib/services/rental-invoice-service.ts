import { db } from '@/lib/drizzle';
import { rentalInvoices, rentals } from '@/lib/drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

export class RentalInvoiceService {
  // Create a new rental invoice
  static async createRentalInvoice(data: {
    rentalId: number;
    invoiceId: string;
    invoiceDate: string;
    dueDate?: string;
    amount: string;
    status?: string;
  }) {
    try {
      const result = await db.insert(rentalInvoices).values({
        rentalId: data.rentalId,
        invoiceId: data.invoiceId,
        invoiceDate: data.invoiceDate,
        dueDate: data.dueDate,
        amount: data.amount,
        status: data.status || 'pending',
        updatedAt: new Date().toISOString().split('T')[0]
      }).returning();

      return result[0];
    } catch (error) {
      console.error('Error creating rental invoice:', error);
      throw error;
    }
  }

  // Get all invoices for a rental
  static async getRentalInvoices(rentalId: number) {
    try {
      // Use raw SQL query for reliable results
      const result = await db.execute(sql`
        SELECT * FROM rental_invoices 
        WHERE rental_id = ${rentalId} 
        ORDER BY invoice_date DESC
      `);

      // Transform the result to match expected format
      const invoices = result.rows.map((row: any) => ({
        id: row.id,
        rentalId: row.rental_id,
        invoiceId: row.invoice_id,
        invoiceDate: row.invoice_date,
        dueDate: row.due_date,
        amount: row.amount,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));

      return invoices;
    } catch (error) {
      console.error('Error fetching rental invoices:', error);
      return [];
    }
  }

  // Get invoice by invoice ID
  static async getInvoiceByInvoiceId(invoiceId: string) {
    try {
      const invoice = await db.query.rentalInvoices.findFirst({
        where: eq(rentalInvoices.invoiceId, invoiceId)
      });
      return invoice;
    } catch (error) {
      console.error('Error fetching invoice by ID:', error);
      return null;
    }
  }

  // Update invoice status
  static async updateInvoiceStatus(invoiceId: string, status: string) {
    try {
      const result = await db.update(rentalInvoices)
        .set({
          status: status,
          updatedAt: new Date().toISOString().split('T')[0]
        })
        .where(eq(rentalInvoices.invoiceId, invoiceId))
        .returning();

      return result[0];
    } catch (error) {
      console.error('Error updating invoice status:', error);
      throw error;
    }
  }

  // Delete invoice
  static async deleteInvoice(invoiceId: string) {
    try {
      await db.delete(rentalInvoices)
        .where(eq(rentalInvoices.invoiceId, invoiceId));

      return true;
    } catch (error) {
      console.error('Error deleting invoice:', error);
      throw error;
    }
  }

  // Get total amount for all invoices of a rental
  static async getTotalInvoiceAmount(rentalId: number) {
    try {
      const invoices = await this.getRentalInvoices(rentalId);
      const total = invoices.reduce((sum, invoice) => {
        return sum + parseFloat(invoice.amount);
      }, 0);
      return total;
    } catch (error) {
      console.error('Error calculating total invoice amount:', error);
      return 0;
    }
  }


}
