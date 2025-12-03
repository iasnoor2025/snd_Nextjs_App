import { db } from '@/lib/drizzle';
import { rentalPayments, rentals } from '@/lib/drizzle/schema';
import { eq, desc, sql } from 'drizzle-orm';

export class RentalPaymentService {
  // Create a new rental payment
  static async createRentalPayment(data: {
    rentalId: number;
    paymentId: string;
    paymentDate: string;
    amount: string;
    status?: string;
  }) {
    try {
      const result = await db.insert(rentalPayments).values({
        rentalId: data.rentalId,
        paymentId: data.paymentId,
        paymentDate: data.paymentDate,
        amount: data.amount,
        status: data.status || 'pending',
        updatedAt: new Date().toISOString().split('T')[0]
      }).returning();

      return result[0];
    } catch (error) {
      console.error('Error creating rental payment:', error);
      throw error;
    }
  }

  // Get all payments for a rental
  static async getRentalPayments(rentalId: number) {
    try {
      // Use raw SQL query for reliable results
      const result = await db.execute(sql`
        SELECT * FROM rental_payments 
        WHERE rental_id = ${rentalId} 
        ORDER BY payment_date DESC
      `);
      
      // Transform the result to match expected format
      const payments = result.rows.map((row: any) => ({
        id: row.id,
        rentalId: row.rental_id,
        paymentId: row.payment_id,
        paymentDate: row.payment_date,
        amount: row.amount,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
      
      return payments;
    } catch (error) {
      console.error('Error fetching rental payments:', error);
      return [];
    }
  }

  // Get payment by payment ID
  static async getPaymentByPaymentId(paymentId: string) {
    try {
      const result = await db.execute(sql`
        SELECT * FROM rental_payments 
        WHERE payment_id = ${paymentId} 
        LIMIT 1
      `);
      
      return result.rows[0] || null;
    } catch (error) {
      console.error('Error fetching payment by ID:', error);
      return null;
    }
  }

  // Update payment status
  static async updatePaymentStatus(paymentId: string, status: string) {
    try {
      const result = await db.execute(sql`
        UPDATE rental_payments 
        SET status = ${status}, updated_at = CURRENT_DATE
        WHERE payment_id = ${paymentId}
        RETURNING *
      `);

      return result.rows[0];
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Delete payment
  static async deletePayment(paymentId: string) {
    try {
      await db.execute(sql`
        DELETE FROM rental_payments 
        WHERE payment_id = ${paymentId}
      `);
      
      return true;
    } catch (error) {
      console.error('Error deleting payment:', error);
      throw error;
    }
  }

  // Get total amount for all payments of a rental
  static async getTotalPaymentAmount(rentalId: number) {
    try {
      const payments = await this.getRentalPayments(rentalId);
      const total = payments.reduce((sum, payment) => {
        return sum + parseFloat(payment.amount);
      }, 0);
      return total;
    } catch (error) {
      console.error('Error calculating total payment amount:', error);
      return 0;
    }
  }
}
