import { db } from '@/lib/drizzle';
import {
  customers,
  employeeAssignments,
  employees,
  equipment,
  equipmentRentalHistory,
  rentalItems,
  rentals,
} from '@/lib/drizzle/schema';
import { and, desc, eq, gte, ilike, lte, or, sql } from 'drizzle-orm';
import { 
  cacheQueryResult, 
  generateCacheKey, 
  CACHE_TAGS, 
  CACHE_PREFIXES 
} from '@/lib/redis';

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
    // Generate cache key based on filters
    const cacheKey = generateCacheKey('rentals', 'list', filters || {});
    
    return cacheQueryResult(
      cacheKey,
      async () => {
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
            supervisor: rentals.supervisor,
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
              
              // Fetch supervisor details if supervisor exists
              let supervisorDetails = null;
              if (rental.supervisor && typeof rental.supervisor === 'string') {
                try {
                  const supervisorRows = await db
                    .select({
                      id: employees.id,
                      first_name: employees.firstName,
                      last_name: employees.lastName,
                      file_number: employees.fileNumber,
                    })
                    .from(employees)
                    .where(eq(employees.id, parseInt(rental.supervisor)))
                    .limit(1);
                  
                  if (supervisorRows.length > 0 && supervisorRows[0]) {
                    supervisorDetails = {
                      id: supervisorRows[0].id,
                      name: `${supervisorRows[0].first_name} ${supervisorRows[0].last_name}`,
                      file_number: supervisorRows[0].file_number,
                    };
                  }
                } catch {
                  // Return rental without items if there's an error
                  // Fetch supervisor details if supervisor exists
                  let supervisorDetails = null;
                  if (rental.supervisor && typeof rental.supervisor === 'string') {
                    try {
                      const supervisorRows = await db
                        .select({
                          id: employees.id,
                          first_name: employees.firstName,
                          last_name: employees.lastName,
                          file_number: employees.fileNumber,
                        })
                        .from(employees)
                        .where(eq(employees.id, parseInt(rental.supervisor)))
                        .limit(1);
                      
                      if (supervisorRows.length > 0 && supervisorRows[0]) {
                        supervisorDetails = {
                          id: supervisorRows[0].id,
                          name: `${supervisorRows[0].first_name} ${supervisorRows[0].last_name}`,
                          file_number: supervisorRows[0].file_number,
                        };
                      }
                    } catch (supervisorError) {
                      console.error('Error fetching supervisor details:', supervisorError);
                    }
                  }

                  return {
                    ...rental,
                    rental_items: [],
                    rentalItems: [], // Add camelCase version for frontend compatibility
                    customer: rental.customerId
                      ? {
                          id: rental.customerId,
                          name: rental.customerName,
                          email: rental.customerEmail,
                          phone: rental.customerPhone,
                        }
                      : null,
                    supervisor_details: supervisorDetails,
                  };
                }
              }

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
                supervisor_details: supervisorDetails,
              };
            } catch (error) {
              // Return rental without items if there's an error
              // Fetch supervisor details if supervisor exists
              let supervisorDetails = null;
              if (rental.supervisor && typeof rental.supervisor === 'string') {
                try {
                  const supervisorRows = await db
                    .select({
                      id: employees.id,
                      first_name: employees.firstName,
                      last_name: employees.lastName,
                      file_number: employees.fileNumber,
                    })
                    .from(employees)
                    .where(eq(employees.id, parseInt(rental.supervisor)))
                    .limit(1);
                  
                  if (supervisorRows.length > 0 && supervisorRows[0]) {
                    supervisorDetails = {
                      id: supervisorRows[0].id,
                      name: `${supervisorRows[0].first_name} ${supervisorRows[0].last_name}`,
                      file_number: supervisorRows[0].file_number,
                    };
                  }
                } catch (supervisorError) {
                  console.error('Error fetching supervisor details:', supervisorError);
                }
              }

              return {
                ...rental,
                rental_items: [],
                rentalItems: [], // Add camelCase version for frontend compatibility
                customer: rental.customerId
                  ? {
                      id: rental.customerId,
                      name: rental.customerName,
                      email: rental.customerEmail,
                      phone: rental.customerPhone,
                    }
                  : null,
                supervisor_details: supervisorDetails,
              };
            }
          })
        );

        return rentalsWithItems;
      },
      {
        ttl: 300, // 5 minutes
        tags: [CACHE_TAGS.RENTALS],
        prefix: CACHE_PREFIXES.RENTALS
      }
    );
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
        supervisor: rentals.supervisor,
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
    startDate?: Date;
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
    supervisor?: string | null;
    notes?: string;
    rentalItems?: any[];
  }) {
    const { rentalItems: itemsToCreate, ...rentalData } = data;

    // Auto-set start date when status becomes active
    let startDate = rentalData.startDate;
    if (rentalData.status === 'active' && !startDate) {
      startDate = new Date();
    }
    
    // For pending rentals, set a placeholder date that will be updated when status becomes active
    if (!startDate) {
      // Set to a far future date to indicate "not started yet"
      startDate = new Date('2099-12-31');
    }

    const [rental] = await db
      .insert(rentals)
      .values({
        customerId: rentalData.customerId || null,
        rentalNumber: rentalData.rentalNumber || `RENTAL-${Date.now()}`,
        startDate: startDate.toISOString().split('T')[0],
        expectedEndDate: rentalData.expectedEndDate?.toISOString().split('T')[0],
        actualEndDate: rentalData.actualEndDate?.toISOString().split('T')[0],
        status: rentalData.status || 'pending',
        paymentStatus: rentalData.paymentStatus || 'pending',
        subtotal: (rentalData.subtotal || 0).toString(),
        taxAmount: (rentalData.taxAmount || 0).toString(),
        totalAmount: (rentalData.totalAmount || 0).toString(),
        discount: (rentalData.discount || 0).toString(),
        tax: (rentalData.tax || 0).toString(),
        finalAmount: (rentalData.finalAmount || 0).toString(),
        supervisor: rentalData.supervisor || null,
        notes: rentalData.notes || '',
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();

    if (!rental) {
      throw new Error('Failed to create rental');
    }

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

    // Create automatic assignments if status is active
    if (rental.status === 'active') {
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
      supervisor?: string;
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

    // If status is changing to active and startDate is the placeholder, update to today
    if (isStatusChangingToActive && currentRental?.startDate === '2099-12-31') {
      updateData.startDate = new Date().toISOString().split('T')[0];
    }

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
              rateType: item.rateType || 'daily',
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

    // If rental dates changed, update existing assignments
    if (rentalData.startDate || rentalData.expectedEndDate) {
      await this.updateRentalAssignmentDates(id, rentalData.startDate, rentalData.expectedEndDate);
    }

    // Recalculate and update financial totals
    await this.recalculateRentalTotals(id);

    return this.getRental(id);
  }

  // Delete rental
  static async deleteRental(id: number) {
    try {
      console.log(`Starting cascade deletion for rental ${id}`);

      // Delete all associated assignments first
      await this.deleteAllRentalAssignments(id);

      // Delete rental items
      await db.delete(rentalItems).where(eq(rentalItems.rentalId, id));

      // Delete rental
      await db.delete(rentals).where(eq(rentals.id, id));

      console.log(`Successfully deleted rental ${id} and all associated data`);
      return true;
    } catch (error) {
      console.error('Error deleting rental:', error);
      return false;
    }
  }

  // Delete all assignments associated with a rental
  static async deleteAllRentalAssignments(rentalId: number) {
    try {
      console.log(`Deleting all assignments for rental ${rentalId}`);

      // Delete employee assignments linked to this rental
      const deletedEmployeeAssignments = await db
        .delete(employeeAssignments)
        .where(eq(employeeAssignments.rentalId, rentalId))
        .returning();

      // Delete equipment assignments linked to this rental
      const deletedEquipmentAssignments = await db
        .delete(equipmentRentalHistory)
        .where(eq(equipmentRentalHistory.rentalId, rentalId))
        .returning();

      console.log(`Deleted ${deletedEmployeeAssignments.length} employee assignments and ${deletedEquipmentAssignments.length} equipment assignments for rental ${rentalId}`);
      
      return {
        employeeAssignments: deletedEmployeeAssignments.length,
        equipmentAssignments: deletedEquipmentAssignments.length
      };
    } catch (error) {
      console.error('Error deleting rental assignments:', error);
      throw error;
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
      })
      .returning();

    // Recalculate rental totals after adding item
    await this.recalculateRentalTotals(data.rentalId);

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

    // Get the rental ID to recalculate totals
    const item = await this.getRentalItem(id);
    if (item) {
      await this.recalculateRentalTotals(item.rentalId);
    }

    return this.getRentalItem(id);
  }

  // Delete rental item
  static async deleteRentalItem(id: number) {
    try {
      // Get the rental item details before deleting
      const item = await this.getRentalItem(id);
      if (!item) {
        return false;
      }
      
      const rentalId = item.rentalId;
      const equipmentId = item.equipmentId;
      const operatorId = item.operatorId;
      
      // Clean up associated assignments before deleting the item
      await this.cleanupRentalItemAssignments(rentalId, equipmentId, operatorId);
      
      // Delete the rental item
      await db.delete(rentalItems).where(eq(rentalItems.id, id));
      
      // Recalculate rental totals after deleting item
      if (rentalId) {
        await this.recalculateRentalTotals(rentalId);
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting rental item:', error);
      return false;
    }
  }

  // Clean up employee and equipment assignments when a rental item is deleted
  static async cleanupRentalItemAssignments(rentalId: number, equipmentId?: number | null, operatorId?: number | null) {
    try {
      // Clean up equipment assignments if equipmentId exists
      if (equipmentId) {
        await db
          .delete(equipmentRentalHistory)
          .where(
            and(
              eq(equipmentRentalHistory.equipmentId, equipmentId),
              eq(equipmentRentalHistory.rentalId, rentalId)
            )
          );
      }

      // Clean up employee assignments if operatorId exists
      if (operatorId) {
        await db
          .delete(employeeAssignments)
          .where(
            and(
              eq(employeeAssignments.employeeId, operatorId),
              eq(employeeAssignments.rentalId, rentalId)
            )
          );
      }

      console.log(`Cleaned up assignments for rental ${rentalId}, equipment ${equipmentId}, operator ${operatorId}`);
    } catch (error) {
      console.error('Error cleaning up rental item assignments:', error);
      throw error;
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
          // Check if equipment assignment already exists (any status)
          const existingEquipmentAssignment = await db
            .select()
            .from(equipmentRentalHistory)
            .where(
              and(
                eq(equipmentRentalHistory.equipmentId, item.equipmentId),
                eq(equipmentRentalHistory.rentalId, rentalId)
              )
            );

          if (existingEquipmentAssignment.length === 0) {
            // Create new equipment assignment with proper date sync
            await db.insert(equipmentRentalHistory).values({
              equipmentId: item.equipmentId,
              rentalId: rentalId,
              projectId: rental.projectId || null,
              assignmentType: 'rental',
              startDate: startDate.toISOString(),
              endDate: endDate?.toISOString() || null,
              status: rental.status === 'active' || rental.status === 'approved' ? 'active' : 'pending',
              notes: `Auto-created equipment assignment for rental ${rental.rentalNumber}`,
              dailyRate: item.unitPrice,
              totalAmount: item.totalPrice,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          } else {
            // Update existing equipment assignment
            await db
              .update(equipmentRentalHistory)
              .set({
                startDate: startDate.toISOString(),
                endDate: endDate?.toISOString() || null,
                status: rental.status === 'active' || rental.status === 'approved' ? 'active' : 'pending',
                projectId: rental.projectId || null,
                updatedAt: new Date().toISOString(),
              })
              .where(eq(equipmentRentalHistory.id, existingEquipmentAssignment[0]?.id));
          }
        }

        if (item.operatorId) {
          // Check if employee assignment already exists (any status)
          const existingEmployeeAssignment = await db
            .select()
            .from(employeeAssignments)
            .where(
              and(
                eq(employeeAssignments.employeeId, item.operatorId),
                eq(employeeAssignments.rentalId, rentalId)
              )
            );

          if (existingEmployeeAssignment.length === 0) {
            // Create new employee assignment with proper date sync and details
            await db.insert(employeeAssignments).values({
              employeeId: item.operatorId,
              rentalId: rentalId,
              projectId: rental.projectId || null,
              startDate: startDate.toISOString().split('T')[0],
              endDate: endDate?.toISOString().split('T')[0] || null,
              status: rental.status === 'active' || rental.status === 'approved' ? 'active' : 'pending',
              notes: `Auto-created operator assignment for rental ${rental.rentalNumber} - Equipment: ${item.equipmentName}`,
              location: rental.locationId ? `Location ID: ${rental.locationId}` : 'Rental Site',
              name: `Rental Operator - ${item.equipmentName}`,
              type: 'rental',
              createdAt: new Date().toISOString().split('T')[0],
              updatedAt: new Date().toISOString().split('T')[0],
            });
          } else {
            // Update existing employee assignment
            await db
              .update(employeeAssignments)
              .set({
                startDate: startDate.toISOString().split('T')[0],
                endDate: endDate?.toISOString().split('T')[0] || null,
                status: rental.status === 'active' || rental.status === 'approved' ? 'active' : 'pending',
                projectId: rental.projectId || null,
                location: rental.locationId ? `Location ID: ${rental.locationId}` : 'Rental Site',
                updatedAt: new Date().toISOString().split('T')[0],
              })
              .where(eq(employeeAssignments.id, existingEmployeeAssignment[0]?.id));
          }
            
          // Auto-assign rental supervisor to the employee if rental has a supervisor (regardless of new/update)
          if (rental.supervisor && item.operatorId) {
            try {
              // Update the employee's supervisor field to match the rental's supervisor
              await db
                .update(employees)
                .set({
                  supervisor: rental.supervisor,
                  updatedAt: new Date().toISOString().split('T')[0],
                })
                .where(eq(employees.id, item.operatorId));
              
              console.log(`Auto-assigned supervisor ${rental.supervisor} to employee ${item.operatorId} for rental ${rental.rentalNumber}`);
            } catch (supervisorError) {
              console.error('Failed to auto-assign supervisor to employee:', supervisorError);
              // Don't fail the main assignment if supervisor assignment fails
            }
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

  // Update assignment dates when rental dates change
  static async updateRentalAssignmentDates(rentalId: number, newStartDate?: Date, newEndDate?: Date | null) {
    try {
      if (!newStartDate && !newEndDate) return;

      const rental = await this.getRental(rentalId);
      if (!rental) return;

      const startDateStr = newStartDate ? newStartDate.toISOString().split('T')[0] : rental.startDate;
      const endDateStr = newEndDate ? newEndDate.toISOString().split('T')[0] : 
                        (newEndDate === null ? null : rental.expectedEndDate);

      // Update employee assignments
      const employeeUpdateData: any = { updatedAt: new Date().toISOString().split('T')[0] };
      if (newStartDate) employeeUpdateData.startDate = startDateStr;
      if (newEndDate !== undefined) employeeUpdateData.endDate = endDateStr;

      await db
        .update(employeeAssignments)
        .set(employeeUpdateData)
        .where(eq(employeeAssignments.rentalId, rentalId));

      // Update equipment assignments
      const equipmentUpdateData: any = { updatedAt: new Date().toISOString() };
      if (newStartDate) equipmentUpdateData.startDate = newStartDate.toISOString();
      if (newEndDate !== undefined) equipmentUpdateData.endDate = newEndDate?.toISOString() || null;

      await db
        .update(equipmentRentalHistory)
        .set(equipmentUpdateData)
        .where(eq(equipmentRentalHistory.rentalId, rentalId));

      console.log(`Updated assignment dates for rental ${rentalId}: start=${startDateStr}, end=${endDateStr}`);
    } catch (error) {
      console.error('Error updating rental assignment dates:', error);
    }
  }

  // Get rental by ID (alias for getRental)
  static async getRentalById(id: number) {
    return this.getRental(id);
  }

  // Recalculate rental totals based on items
  static async recalculateRentalTotals(rentalId: number) {
    try {
      const items = await this.getRentalItems(rentalId);
      const rental = await this.getRentalById(rentalId);
      
      if (!rental) {
        throw new Error('Rental not found');
      }
      
      let subtotal = 0;
      
      // Update each rental item with calculated total and accumulate subtotal
      for (const item of items) {
        const itemTotal = this.calculateItemTotal(item, rental);
        subtotal += itemTotal;
        
        // Update the rental item's totalPrice with the calculated amount
        await db.update(rentalItems).set({
          totalPrice: itemTotal.toString(),
          updatedAt: new Date().toISOString().split('T')[0],
        }).where(eq(rentalItems.id, item.id));
      }
      
      const taxRate = 15; // Default 15% VAT for KSA
      const taxAmount = subtotal * (taxRate / 100);
      const totalAmount = subtotal + taxAmount;
      
      // Update rental with calculated totals
      await db.update(rentals).set({
        subtotal: subtotal.toString(),
        taxAmount: taxAmount.toString(),
        totalAmount: totalAmount.toString(),
        tax: taxRate.toString(),
        finalAmount: totalAmount.toString(),
        updatedAt: new Date().toISOString().split('T')[0],
      }).where(eq(rentals.id, rentalId));
      
      console.log('Recalculated rental totals:', {
        rentalId,
        subtotal,
        taxAmount,
        totalAmount,
        itemsUpdated: items.length
      });
      
    } catch (error) {
      console.error('Error recalculating rental totals:', error);
    }
  }

  // Calculate total price for a single rental item based on rate type and duration
  static calculateItemTotal(item: any, rental: any): number {
    const { unitPrice, quantity = 1, rateType = 'daily' } = item;
    const basePrice = parseFloat(unitPrice?.toString() || '0') || 0;
    
    // Calculate actual rental period
    if (rental?.startDate) {
      const startDate = new Date(rental.startDate);
      let endDate: Date;
      
      // Use actual end date if rental is completed, otherwise use today
      if (rental.status === 'completed' && rental.expectedEndDate) {
        endDate = new Date(rental.expectedEndDate);
      } else {
        // For active rentals, calculate from start date to today
        endDate = new Date();
      }
      
      // Ensure we don't go before the start date
      if (endDate < startDate) {
        endDate = startDate;
      }
      
      if (rateType === 'hourly') {
        const hoursDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)));
        return basePrice * hoursDiff * quantity;
      } else if (rateType === 'weekly') {
        const weeksDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7)));
        return basePrice * weeksDiff * quantity;
      } else if (rateType === 'monthly') {
        const monthsDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
        return basePrice * monthsDiff * quantity;
      } else {
        // Daily rate - calculate days
        const daysDiff = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
        return basePrice * daysDiff * quantity;
      }
    }
    
    // Fallback to stored totalPrice if no start date available
    return parseFloat(item.totalPrice?.toString() || '0') || 0;
  }

  // Create or update equipment assignment for rental item
  static async createEquipmentAssignment(rentalId: number, equipmentId: number, unitPrice: number, totalPrice: number, startDate: Date, endDate?: Date) {
    try {
      // Check if equipment assignment already exists
      const existingAssignment = await db
        .select()
        .from(equipmentRentalHistory)
        .where(
          and(
            eq(equipmentRentalHistory.equipmentId, equipmentId),
            eq(equipmentRentalHistory.rentalId, rentalId),
            eq(equipmentRentalHistory.status, 'active')
          )
        );

      if (existingAssignment.length === 0) {
        // Create new equipment assignment with rental sync
        const rental = await this.getRental(rentalId);
        await db.insert(equipmentRentalHistory).values({
          equipmentId,
          rentalId,
          projectId: rental?.projectId || null,
          assignmentType: 'rental',
          startDate: startDate.toISOString(),
          endDate: endDate?.toISOString() || null,
          status: 'active',
          notes: `Auto-created for rental assignment - Rental: ${rental?.rentalNumber || rentalId}`,
          dailyRate: unitPrice,
          totalAmount: totalPrice,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Update existing assignment
        await db
          .update(equipmentRentalHistory)
          .set({
            dailyRate: unitPrice.toString(),
            totalAmount: totalPrice.toString(),
            endDate: endDate?.toISOString() || null,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(equipmentRentalHistory.id, existingAssignment[0]?.id || 0));
      }
    } catch (error) {
      console.error('Error creating/updating equipment assignment:', error);
    }
  }

  // Remove equipment assignment when rental item is deleted
  static async removeEquipmentAssignment(rentalId: number, equipmentId: number) {
    try {
      await db
        .update(equipmentRentalHistory)
        .set({
          status: 'inactive',
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(equipmentRentalHistory.rentalId, rentalId),
            eq(equipmentRentalHistory.equipmentId, equipmentId),
            eq(equipmentRentalHistory.status, 'active')
          )
        );
    } catch (error) {
      console.error('Error removing equipment assignment:', error);
    }
  }
}
