import { db } from '@/lib/db';
import {
  customers,
  employeeAssignments,
  equipment,
  equipmentRentalHistory,
  rentalItems,
  rentals,
} from '@/lib/drizzle/schema';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';

export class RentalService {
  // Get all rentals with filters
  static async getRentals(filters?: {
    search?: string;
    status?: string;
    customerId?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const conditions: any[] = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(rentals.rentalNumber, `%${filters.search}%`),
          ilike(customers.name, `%${filters.search}%`)
        )
      );
    }

    if (filters?.status) {
      conditions.push(eq(rentals.status, filters.status));
    }

    if (filters?.customerId) {
      conditions.push(eq(rentals.customerId, parseInt(filters.customerId)));
    }

    if (filters?.paymentStatus) {
      conditions.push(eq(rentals.paymentStatus, filters.paymentStatus));
    }

    if (filters?.startDate) {
      conditions.push(gte(rentals.startDate, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(rentals.expectedEndDate, filters.endDate));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db
      .select({
        id: rentals.id,
        customerId: rentals.customerId,
        rentalNumber: rentals.rentalNumber,
        projectId: rentals.projectId,
        startDate: rentals.startDate,
        expectedEndDate: rentals.expectedEndDate,
        actualEndDate: rentals.actualEndDate,
        status: rentals.status,
        subtotal: rentals.subtotal,
        taxAmount: rentals.taxAmount,
        totalAmount: rentals.totalAmount,
        discount: rentals.discount,
        tax: rentals.tax,
        finalAmount: rentals.finalAmount,
        paymentStatus: rentals.paymentStatus,
        notes: rentals.notes,
        createdBy: rentals.createdBy,
        equipmentName: rentals.equipmentName,
        description: rentals.description,
        quotationId: rentals.quotationId,
        mobilizationDate: rentals.mobilizationDate,
        invoiceDate: rentals.invoiceDate,
        depositAmount: rentals.depositAmount,
        paymentTermsDays: rentals.paymentTermsDays,
        paymentDueDate: rentals.paymentDueDate,
        hasTimesheet: rentals.hasTimesheet,
        hasOperators: rentals.hasOperators,
        completedBy: rentals.completedBy,
        completedAt: rentals.completedAt,
        approvedBy: rentals.approvedBy,
        approvedAt: rentals.approvedAt,
        depositPaid: rentals.depositPaid,
        depositPaidDate: rentals.depositPaidDate,
        depositRefunded: rentals.depositRefunded,
        depositRefundDate: rentals.depositRefundDate,
        invoiceId: rentals.invoiceId,
        locationId: rentals.locationId,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt,
        deletedAt: rentals.deletedAt,
        // Customer fields
        customerName: customers.name,
        customerEmail: customers.email,
        customerPhone: customers.phone,
        // Project fields (if needed)
        projectName: sql<string>`NULL`,
      })
      .from(rentals)
      .leftJoin(customers, eq(rentals.customerId, customers.id))
      .where(whereClause)
      .orderBy(desc(rentals.createdAt));

    // Get rental items for each rental
    const rentalsWithItems = await Promise.all(
      results.map(async rental => {
        try {
          
          const items = await this.getRentalItems(rental.id);
          
          return {
            ...rental,
            rental_items: items || [],
            rentalItems: items || [], // Add camelCase version for frontend compatibility
            customer: rental.customerName
              ? {
                  id: rental.customerId,
                  name: rental.customerName,
                  email: rental.customerEmail,
                  phone: rental.customerPhone,
                }
              : null,
          };
        } catch (error) {

          // Return rental without items if there's an error
          return {
            ...rental,
            rental_items: [],
            rentalItems: [], // Add camelCase version for frontend compatibility
            customer: rental.customerName
              ? {
                  id: rental.customerId,
                  name: rental.customerName,
                  email: rental.customerEmail,
                  phone: rental.customerPhone,
                }
              : null,
          };
        }
      })
    );

    return rentalsWithItems;
  }

  // Get single rental by ID
  static async getRental(id: number) {
    const result = await db
      .select({
        id: rentals.id,
        customerId: rentals.customerId,
        rentalNumber: rentals.rentalNumber,
        projectId: rentals.projectId,
        startDate: rentals.startDate,
        expectedEndDate: rentals.expectedEndDate,
        actualEndDate: rentals.actualEndDate,
        status: rentals.status,
        subtotal: rentals.subtotal,
        taxAmount: rentals.taxAmount,
        totalAmount: rentals.totalAmount,
        discount: rentals.discount,
        tax: rentals.tax,
        finalAmount: rentals.finalAmount,
        paymentStatus: rentals.paymentStatus,
        notes: rentals.notes,
        deliveryTerms: rentals.deliveryTerms,
        shipmentTerms: rentals.shipmentTerms,
        rentalTerms: rentals.rentalTerms,
        paymentTerms: rentals.paymentTerms,
        additionalTerms: rentals.additionalTerms,
        mdTerms: rentals.mdTerms,
        termsLastUpdated: rentals.termsLastUpdated,
        termsUpdateNotes: rentals.termsUpdateNotes,
        createdBy: rentals.createdBy,
        equipmentName: rentals.equipmentName,
        description: rentals.description,
        quotationId: rentals.quotationId,
        mobilizationDate: rentals.mobilizationDate,
        invoiceDate: rentals.invoiceDate,
        depositAmount: rentals.depositAmount,
        paymentTermsDays: rentals.paymentTermsDays,
        paymentDueDate: rentals.paymentDueDate,
        hasTimesheet: rentals.hasTimesheet,
        hasOperators: rentals.hasOperators,
        completedBy: rentals.completedBy,
        completedAt: rentals.completedAt,
        approvedBy: rentals.approvedBy,
        approvedAt: rentals.approvedAt,
        depositPaid: rentals.depositPaid,
        depositPaidDate: rentals.depositPaidDate,
        depositRefunded: rentals.depositRefunded,
        depositRefundDate: rentals.depositRefundDate,
        invoiceId: rentals.invoiceId,
        locationId: rentals.locationId,
        createdAt: rentals.createdAt,
        updatedAt: rentals.updatedAt,
        deletedAt: rentals.deletedAt,
      })
      .from(rentals)
      .where(eq(rentals.id, id));

    if (result.length === 0) {
      return null;
    }

    const rental = result[0];

    if (!rental) {
      throw new Error('Rental not found');
    }

    const customerData = await db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        company: customers.companyName,
        address: customers.address,
        vat: customers.taxNumber,
      })
      .from(customers)
      .where(eq(customers.id, rental.customerId!))
      .limit(1);

    const customer = customerData[0] || null;
    const items = await this.getRentalItems(id);

    return {
      ...rental,
      rental_items: items,
      rentalItems: items, // Add camelCase version for frontend compatibility
      customer: customer
        ? {
            id: customer.id,
            name: customer.name || 'Unknown Customer',
            email: customer.email || '',
            phone: customer.phone || '',
            company: customer.company || '',
            address: customer.address || '',
            vat: customer.vat || '',
          }
        : {
            id: rental.customerId,
            name: 'Unknown Customer',
            email: '',
            phone: '',
            company: '',
            address: '',
            vat: '',
          },
    };
  }

  // Create new rental
  static async createRental(data: {
    customerId: number;
    rentalNumber: string;
    startDate: Date;
    expectedEndDate?: Date;
    actualEndDate?: Date;
    status?: string;
    paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
    subtotal?: number;
    taxAmount?: number;
    totalAmount: number;
    discount?: number;
    tax?: number;
    finalAmount?: number;
    depositAmount?: number;
    paymentTermsDays?: number;
    hasTimesheet?: boolean;
    hasOperators?: boolean;
    notes?: string;
    rentalItems?: any[];
  }) {
    const { rentalItems: itemsToCreate, ...rentalData } = data;

    const [rental] = await db
      .insert(rentals)
      .values({
        customerId: rentalData.customerId || null,
        rentalNumber: rentalData.rentalNumber || `RENTAL-${Date.now()}`,
        startDate: rentalData.startDate.toISOString().split('T')[0],
        expectedEndDate: rentalData.expectedEndDate?.toISOString().split('T')[0],
        actualEndDate: rentalData.actualEndDate?.toISOString().split('T')[0],
        status: rentalData.status || 'pending',
        paymentStatus: rentalData.paymentStatus || 'pending',
        subtotal: rentalData.subtotal || 0,
        taxAmount: rentalData.taxAmount || 0,
        totalAmount: rentalData.totalAmount || 0,
        discount: rentalData.discount || 0,
        tax: rentalData.tax || 0,
        finalAmount: rentalData.finalAmount || 0,
        depositAmount: rentalData.depositAmount || 0,
        paymentTermsDays: rentalData.paymentTermsDays || 30,
        hasTimesheet: rentalData.hasTimesheet || false,
        hasOperators: rentalData.hasOperators || false,
        notes: rentalData.notes || '',
        updatedAt: new Date().toISOString().split('T')[0],
      } as any)
      .returning();

    // Create rental items if provided
    if (itemsToCreate && itemsToCreate.length > 0) {
      await Promise.all(
        itemsToCreate.map((item: any) =>
          db.insert(rentalItems).values({
            rentalId: rental.id,
            equipmentId: item.equipmentId ? parseInt(item.equipmentId) : null,
            equipmentName: item.equipmentName,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            rateType: item.rateType,
            operatorId: item.operatorId ? parseInt(item.operatorId) : null,
            status: item.status || 'active',
            notes: item.notes,
            updatedAt: new Date().toISOString().split('T')[0],
          })
        )
      );
    }

    // Create automatic assignments if needed
    if (rental.hasOperators) {
      await this.createAutomaticAssignments(rental.id);
    }

    return this.getRental(rental.id);
  }

  // Update rental
  static async updateRental(
    id: number,
    data: {
      customerId?: number;
      rentalNumber?: string;
      startDate?: Date;
      expectedEndDate?: Date | null;
      actualEndDate?: Date | null;
      status?: string;
      paymentStatus?: string;
      subtotal?: number;
      taxAmount?: number;
      totalAmount?: number;
      discount?: number;
      tax?: number;
      finalAmount?: number;
      depositAmount?: number;
      paymentTermsDays?: number;
      hasTimesheet?: boolean;
      hasOperators?: boolean;
      notes?: string;
      rentalItems?: any[];
      approvedAt?: string;
      mobilizationDate?: string;
      completedAt?: string;
      invoiceDate?: string;
    }
  ) {
    const { rentalItems: itemsToUpdate, ...rentalData } = data;

    // Handle null values for dates
    const updateData: any = { ...rentalData };
    if (updateData.startDate) {
      updateData.startDate = updateData.startDate.toISOString().split('T')[0];
    }
    if (updateData.expectedEndDate !== undefined) {
      updateData.expectedEndDate = updateData.expectedEndDate?.toISOString().split('T')[0] || null;
    }
    if (updateData.actualEndDate !== undefined) {
      updateData.actualEndDate = updateData.actualEndDate?.toISOString().split('T')[0] || null;
    }
    if (updateData.mobilizationDate) {
      updateData.mobilizationDate = updateData.mobilizationDate;
    }
    if (updateData.invoiceDate) {
      updateData.invoiceDate = updateData.invoiceDate;
    }
    if (updateData.completedAt) {
      updateData.completedAt = updateData.completedAt;
    }
    if (updateData.approvedAt) {
      updateData.approvedAt = updateData.approvedAt;
    }

    updateData.updatedAt = new Date().toISOString().split('T')[0];

    // Check if status is changing to active/approved
    const currentRental = await this.getRental(id);
    const isStatusChangingToActive =
      (rentalData.status === 'active' || rentalData.status === 'approved') &&
      currentRental?.status !== 'active' &&
      currentRental?.status !== 'approved';

    await db.update(rentals).set(updateData).where(eq(rentals.id, id));

    // Handle rental items if provided
    if (itemsToUpdate) {
      // Delete existing items
      await db.delete(rentalItems).where(eq(rentalItems.rentalId, id));

      // Create new items
      if (itemsToUpdate.length > 0) {
        await Promise.all(
          itemsToUpdate.map((item: any) =>
            db.insert(rentalItems).values({
              rentalId: id,
              equipmentId: item.equipmentId ? parseInt(item.equipmentId) : null,
              equipmentName: item.equipmentName,
              unitPrice: item.unitPrice,
              totalPrice: item.totalPrice,
              rateType: item.rateType,
              operatorId: item.operatorId ? parseInt(item.operatorId) : null,
              status: item.status || 'active',
              notes: item.notes,
              updatedAt: new Date().toISOString().split('T')[0],
            })
          )
        );
      }
    }

    // If status is changing to active, create automatic assignments
    if (isStatusChangingToActive) {
      await this.createAutomaticAssignments(id);
    }

    return this.getRental(id);
  }

  // Delete rental
  static async deleteRental(id: number) {
    try {
      // Delete rental items first
      await db.delete(rentalItems).where(eq(rentalItems.rentalId, id));

      // Delete rental
      await db.delete(rentals).where(eq(rentals.id, id));

      return true;
    } catch (error) {
      
      return false;
    }
  }

  // Add rental item
  static async addRentalItem(data: {
    rentalId: number;
    equipmentId?: number | null;
    equipmentName: string;
    unitPrice: number;
    totalPrice: number;
    rateType?: string;
    operatorId?: number | null;
    status?: string;
    notes?: string;
  }) {
    const [result] = await db
      .insert(rentalItems)
      .values({
        rentalId: data.rentalId,
        equipmentId: data.equipmentId,
        equipmentName: data.equipmentName,
        unitPrice: data.unitPrice,
        totalPrice: data.totalPrice,
        rateType: data.rateType || 'daily',
        operatorId: data.operatorId,
        status: data.status || 'active',
        notes: data.notes || '',
        updatedAt: new Date().toISOString().split('T')[0],
      } as any)
      .returning();

    return this.getRentalItem(result.id);
  }

  // Get rental items for a rental
  static async getRentalItems(rentalId: number) {
    return await db
      .select({
        id: rentalItems.id,
        rentalId: rentalItems.rentalId,
        equipmentId: rentalItems.equipmentId,
        equipmentName: rentalItems.equipmentName,
        unitPrice: rentalItems.unitPrice,
        totalPrice: rentalItems.totalPrice,
        rateType: rentalItems.rateType,
        operatorId: rentalItems.operatorId,
        status: rentalItems.status,
        notes: rentalItems.notes,
        createdAt: rentalItems.createdAt,
        updatedAt: rentalItems.updatedAt,
        // Equipment fields
        equipmentModelNumber: equipment.modelNumber,
        equipmentCategoryId: equipment.categoryId,
      })
      .from(rentalItems)
      .leftJoin(equipment, eq(rentalItems.equipmentId, equipment.id))
      .where(eq(rentalItems.rentalId, rentalId))
      .orderBy(desc(rentalItems.createdAt));
  }

  // Get single rental item
  static async getRentalItem(id: number) {
    const result = await db
      .select({
        id: rentalItems.id,
        rentalId: rentalItems.rentalId,
        equipmentId: rentalItems.equipmentId,
        equipmentName: rentalItems.equipmentName,
        unitPrice: rentalItems.unitPrice,
        totalPrice: rentalItems.totalPrice,
        rateType: rentalItems.rateType,
        operatorId: rentalItems.operatorId,
        status: rentalItems.status,
        notes: rentalItems.notes,
        createdAt: rentalItems.createdAt,
        updatedAt: rentalItems.updatedAt,
        // Equipment fields
        equipmentModelNumber: equipment.modelNumber,
        equipmentCategoryId: equipment.categoryId,
      })
      .from(rentalItems)
      .leftJoin(equipment, eq(rentalItems.equipmentId, equipment.id))
      .where(eq(rentalItems.id, id));

    return result.length > 0 ? result[0] : null;
  }

  // Update rental item
  static async updateRentalItem(
    id: number,
    data: {
      equipmentId?: number | null;
      equipmentName?: string;
      unitPrice?: number;
      totalPrice?: number;
      rateType?: string;
      operatorId?: number | null;
      status?: string;
      notes?: string;
    }
  ) {
    const updateData: any = { ...data };
    updateData.updatedAt = new Date().toISOString().split('T')[0];

    await db.update(rentalItems).set(updateData).where(eq(rentalItems.id, id));

    return this.getRentalItem(id);
  }

  // Delete rental item
  static async deleteRentalItem(id: number) {
    try {
      await db.delete(rentalItems).where(eq(rentalItems.id, id));
      return true;
    } catch (error) {
      
      return false;
    }
  }

  // Create automatic assignments for equipment and employees when rental becomes active
  static async createAutomaticAssignments(rentalId: number) {
    try {
      // Get rental details
      const rental = await this.getRental(rentalId);
      if (!rental) {
        
        return;
      }

      // Get rental items
      const items = await this.getRentalItems(rentalId);
      if (!items || items.length === 0) {
        
        return;
      }

      const startDate = new Date(rental.startDate);
      const endDate = rental.expectedEndDate ? new Date(rental.expectedEndDate) : null;

      // Create equipment assignments for each rental item with equipment
      for (const item of items) {
        if (item.equipmentId) {
          // Check if equipment assignment already exists
          const existingEquipmentAssignment = await db
            .select()
            .from(equipmentRentalHistory)
            .where(
              and(
                eq(equipmentRentalHistory.equipmentId, item.equipmentId),
                eq(equipmentRentalHistory.rentalId, rentalId),
                eq(equipmentRentalHistory.status, 'active')
              )
            );

          if (existingEquipmentAssignment.length === 0) {
            // Create new equipment assignment
            await db.insert(equipmentRentalHistory).values({
              equipmentId: item.equipmentId,
              rentalId: rentalId,
              assignmentType: 'rental',
              startDate: startDate.toISOString(),
              endDate: endDate?.toISOString() || null,
              status: 'active',
              notes: `Auto-created for rental ${rental.rentalNumber}`,
              dailyRate: item.unitPrice,
              totalAmount: item.totalPrice,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            
          }
        }

        if (item.operatorId) {
          // Check if employee assignment already exists
          const existingEmployeeAssignment = await db
            .select()
            .from(employeeAssignments)
            .where(
              and(
                eq(employeeAssignments.employeeId, item.operatorId),
                eq(employeeAssignments.rentalId, rentalId),
                eq(employeeAssignments.status, 'active')
              )
            );

          if (existingEmployeeAssignment.length === 0) {
            // Create new employee assignment
            await db.insert(employeeAssignments).values({
              employeeId: item.operatorId,
              rentalId: rentalId,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate?.toISOString().split('T')[0] || null,
              status: 'active',
              notes: `Auto-created for rental ${rental.rentalNumber}`,
              type: 'rental',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            });
            
          }
        }
      }

    } catch (error) {
      
    }
  }

  // Update assignment statuses when rental status changes
  static async updateAssignmentStatuses(rentalId: number, newStatus: string) {
    try {
      const statusMap: { [key: string]: string } = {
        active: 'active',
        approved: 'active',
        completed: 'completed',
        cancelled: 'cancelled',
        suspended: 'suspended',
      };

      const assignmentStatus = statusMap[newStatus] || 'active';

      // Update equipment assignments
      await db
        .update(equipmentRentalHistory)
        .set({
          status: assignmentStatus,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(equipmentRentalHistory.rentalId, rentalId));

      // Update employee assignments
      await db
        .update(employeeAssignments)
        .set({
          status: assignmentStatus,
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .where(eq(employeeAssignments.rentalId, rentalId));

    } catch (error) {
      
    }
  }
}
