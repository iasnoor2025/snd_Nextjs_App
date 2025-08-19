// Legacy database file - use @/lib/drizzle instead
import { db } from '@/lib/drizzle';
import { customers, equipment, rentalItems, rentals, users } from '@/lib/drizzle/schema';
import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';

export class DatabaseService {
  // Customer operations
  static async getCustomers(options?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    // Build filters (Drizzle)
    const filters: any[] = [];
    if (options?.search) {
      const s = `%${options.search}%`;
      filters.push(
        or(
          ilike(customers.name, s),
          ilike(customers.companyName, s),
          ilike(customers.contactPerson, s),
          ilike(customers.email, s),
          ilike(customers.phone, s)
        )
      );
    }
    if (options?.status) {
      filters.push(eq(customers.status, options.status));
    }
    const whereExpr = filters.length ? and(...filters) : undefined;

    // Order by mapping
    const sortBy = options?.sortBy || 'created_at';
    const sortOrder = options?.sortOrder || 'desc';
    const orderCol = (() => {
      switch (sortBy) {
        case 'name':
          return customers.name;
        case 'company_name':
          return customers.companyName;
        case 'email':
          return customers.email;
        case 'status':
          return customers.status;
        case 'created_at':
        default:
          return customers.createdAt;
      }
    })();

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereExpr as any);
    const totalCount = Number((totalRow as any)[0]?.count ?? 0);

    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        contact_person: customers.contactPerson,
        email: customers.email,
        phone: customers.phone,
        address: customers.address,
        city: customers.city,
        state: customers.state,
        postal_code: customers.postalCode,
        country: customers.country,
        website: customers.website,
        tax_number: customers.taxNumber,
        credit_limit: customers.creditLimit,
        payment_terms: customers.paymentTerms,
        notes: customers.notes,
        is_active: customers.isActive,
        company_name: customers.companyName,
        erpnext_id: customers.erpnextId,
        status: customers.status,
        created_at: customers.createdAt,
        updated_at: customers.updatedAt,
      })
      .from(customers)
      .where(whereExpr as any)
      .orderBy((sortOrder === 'asc' ? asc : desc)(orderCol))
      .offset(skip)
      .limit(limit);

    return {
      customers: rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1,
      },
    };
  }

  static async getCustomerById(id: number) {
    const customerRows = await db.select().from(customers).where(eq(customers.id, id)).limit(1);

    return customerRows[0] || null;
  }

  static async createCustomer(data: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    company_name?: string;
    contact_person?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    website?: string;
    tax_number?: string;
    credit_limit?: number;
    payment_terms?: string;
    notes?: string;
    is_active?: boolean;
    erpnext_id?: string;
  }) {
    const inserted = await db
      .insert(customers)
      .values({
        name: data.name,
        email: data.email ?? null,
        phone: data.phone ?? null,
        address: data.address ?? null,
        companyName: data.company_name ?? null,
        contactPerson: data.contact_person ?? null,
        city: data.city ?? null,
        state: data.state ?? null,
        postalCode: data.postal_code ?? null,
        country: data.country ?? null,
        website: data.website ?? null,
        taxNumber: data.tax_number ?? null,
        creditLimit: data.credit_limit ? data.credit_limit.toString() : null,
        paymentTerms: data.payment_terms ?? null,
        notes: data.notes ?? null,
        isActive: data.is_active ?? true,
        erpnextId: data.erpnext_id ?? null,
        status: 'active',
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .returning();
    return inserted[0];
  }

  static async updateCustomer(
    id: number,
    data: {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      company_name?: string;
      contact_person?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
      website?: string;
      tax_number?: string;
      credit_limit?: number;
      payment_terms?: string;
      notes?: string;
      is_active?: boolean;
      erpnext_id?: string;
    }
  ) {
    const updated = await db
      .update(customers)
      .set({
        name: data.name ?? undefined,
        email: data.email ?? undefined,
        phone: data.phone ?? undefined,
        address: data.address ?? undefined,
        companyName: data.company_name ?? undefined,
        contactPerson: data.contact_person ?? undefined,
        city: data.city ?? undefined,
        state: data.state ?? undefined,
        postalCode: data.postal_code ?? undefined,
        country: data.country ?? undefined,
        website: data.website ?? undefined,
        taxNumber: data.tax_number ?? undefined,
        creditLimit: data.credit_limit ? data.credit_limit.toString() : undefined,
        paymentTerms: data.payment_terms ?? undefined,
        notes: data.notes ?? undefined,
        isActive: data.is_active ?? undefined,
        erpnextId: data.erpnext_id ?? undefined,
        updatedAt: new Date().toISOString().split('T')[0],
      })
      .where(eq(customers.id, id))
      .returning();
    return updated[0];
  }

  static async deleteCustomer(id: number) {
    await db.delete(customers).where(eq(customers.id, id));
    return true;
  }

  static async getCustomerStatistics() {
    const [totalRow, activeRow, syncedRow, localOnlyRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customers),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(eq(customers.isActive, true as any)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(sql`erpnext_id is not null` as any),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customers)
        .where(sql`erpnext_id is null` as any),
    ]);
    const totalCustomers = Number((totalRow as any)[0]?.count ?? 0);
    const activeCustomers = Number((activeRow as any)[0]?.count ?? 0);
    const erpnextSyncedCustomers = Number((syncedRow as any)[0]?.count ?? 0);
    const localOnlyCustomers = Number((localOnlyRow as any)[0]?.count ?? 0);

    return { totalCustomers, activeCustomers, erpnextSyncedCustomers, localOnlyCustomers };
  }

  // Note: The following methods were using Prisma and have been implemented with Drizzle
  // For now, they return null to indicate they need proper implementation

  static async syncCustomerFromERPNext(erpnextId: string, customerData: any) {
    // TODO: Implement with Drizzle
    
    return null;
  }

  static async getCustomerByERPNextId(erpnextId: string) {
    // TODO: Implement with Drizzle
    
    return null;
  }

  // Equipment operations - Implemented with Drizzle
  static async getEquipment() {
    try {
      const equipmentRows = await db
        .select()
        .from(equipment)
        .where(eq(equipment.isActive, true))
        .orderBy(desc(equipment.createdAt));

      return equipmentRows;
    } catch (error) {
      
      return [];
    }
  }

  static async getEquipmentById(id: number) {
    try {
      const equipmentRows = await db.select().from(equipment).where(eq(equipment.id, id)).limit(1);

      return equipmentRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async createEquipment(data: {
    name: string;
    description?: string;
    category: string;
    dailyRate: number;
  }) {
    try {
      const equipmentRows = await db
        .insert(equipment)
        .values({
          name: data.name,
          description: data.description || null,
          dailyRate: data.dailyRate.toString(),
          status: 'available',
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .returning();

      return equipmentRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async updateEquipment(
    id: number,
    data: {
      name?: string;
      description?: string;
      category?: string;
      status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED';
      dailyRate?: number;
    }
  ) {
    try {
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.dailyRate !== undefined) updateData.dailyRate = data.dailyRate.toString();

      updateData.updatedAt = new Date().toISOString().split('T')[0];

      const equipmentRows = await db
        .update(equipment)
        .set(updateData)
        .where(eq(equipment.id, id))
        .returning();

      return equipmentRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async deleteEquipment(id: number) {
    try {
      await db.update(equipment).set({ isActive: false }).where(eq(equipment.id, id));

      return true;
    } catch (error) {
      
      return false;
    }
  }

  // Rental operations - Implemented with Drizzle
  static async getRentals(filters?: {
    search?: string;
    status?: string;
    customerId?: string;
    paymentStatus?: string;
    startDate?: string;
    endDate?: string;
  }) {
    try {
      // TODO: Implement rental filtering with Drizzle
      // This would require proper joins with customers and rental_items tables

      const rentalRows = await db.select().from(rentals).orderBy(desc(rentals.createdAt));

      return rentalRows;
    } catch (error) {
      
      return [];
    }
  }

  static async getRental(id: number) {
    try {
      const rentalRows = await db.select().from(rentals).where(eq(rentals.id, id)).limit(1);

      return rentalRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

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
    try {
      // TODO: Implement rental creation with items
      // This would require transaction handling for rental + rental items

      const { rentalItems, ...rentalData } = data;

      const rentalRows = await db
        .insert(rentals)
        .values({
          customerId: rentalData.customerId,
          rentalNumber: rentalData.rentalNumber || `RENTAL-${Date.now()}`,
          startDate: rentalData.startDate.toISOString().split('T')[0],
          expectedEndDate: rentalData.expectedEndDate?.toISOString().split('T')[0] || null,
          actualEndDate: rentalData.actualEndDate?.toISOString().split('T')[0] || null,
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
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .returning();

      return rentalRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

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
    try {
      // TODO: Implement rental update with items

      const updateData: any = {};

      if (data.customerId !== undefined) updateData.customerId = data.customerId;
      if (data.rentalNumber !== undefined) updateData.rentalNumber = data.rentalNumber;
      if (data.startDate !== undefined)
        updateData.startDate = data.startDate.toISOString().split('T')[0];
      if (data.expectedEndDate !== undefined)
        updateData.expectedEndDate = data.expectedEndDate?.toISOString().split('T')[0] || null;
      if (data.actualEndDate !== undefined)
        updateData.actualEndDate = data.actualEndDate?.toISOString().split('T')[0] || null;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.paymentStatus !== undefined) updateData.paymentStatus = data.paymentStatus;
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
      if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;
      if (data.totalAmount !== undefined) updateData.totalAmount = data.totalAmount;
      if (data.discount !== undefined) updateData.discount = data.discount;
      if (data.tax !== undefined) updateData.tax = data.tax;
      if (data.finalAmount !== undefined) updateData.finalAmount = data.finalAmount;
      if (data.depositAmount !== undefined) updateData.depositAmount = data.depositAmount;
      if (data.paymentTermsDays !== undefined) updateData.paymentTermsDays = data.paymentTermsDays;
      if (data.hasTimesheet !== undefined) updateData.hasTimesheet = data.hasTimesheet;
      if (data.hasOperators !== undefined) updateData.hasOperators = data.hasOperators;
      if (data.notes !== undefined) updateData.notes = data.notes;

      updateData.updatedAt = new Date().toISOString().split('T')[0];

      const rentalRows = await db
        .update(rentals)
        .set(updateData)
        .where(eq(rentals.id, id))
        .returning();

      return rentalRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async deleteRental(id: number) {
    try {
      await db.update(rentals).set({ isActive: false }).where(eq(rentals.id, id));

      return true;
    } catch (error) {
      
      return false;
    }
  }

  // User operations - Implemented with Drizzle
  static async getUsers() {
    try {
      const userRows = await db
        .select()
        .from(users)
        .where(eq(users.isActive, true))
        .orderBy(desc(users.createdAt));

      return userRows;
    } catch (error) {
      
      return [];
    }
  }

  static async getUserById(id: number) {
    try {
      const userRows = await db.select().from(users).where(eq(users.id, id)).limit(1);

      return userRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async getUserByEmail(email: string) {
    try {
      const userRows = await db.select().from(users).where(eq(users.email, email)).limit(1);

      return userRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async createUser(data: {
    email: string;
    name?: string;
    role?: 'ADMIN' | 'USER' | 'MANAGER' | 'SUPER_ADMIN';
    password: string;
  }) {
    try {
      // TODO: Implement password hashing

      const userRows = await db
        .insert(users)
        .values({
          email: data.email,
          name: data.name || 'Unknown User',
          roleId: data.role || 'USER',
          password: data.password, // Should be hashed
          isActive: true,
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .returning();

      return userRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async updateUser(
    id: number,
    data: {
      email?: string;
      name?: string;
      role?: 'ADMIN' | 'USER' | 'MANAGER' | 'SUPER_ADMIN';
    }
  ) {
    try {
      const updateData: any = {};

      if (data.email !== undefined) updateData.email = data.email;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.role !== undefined) updateData.roleId = data.role;

      updateData.updatedAt = new Date().toISOString().split('T')[0];

      const userRows = await db.update(users).set(updateData).where(eq(users.id, id)).returning();

      return userRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async deleteUser(id: number) {
    try {
      await db.update(users).set({ isActive: false }).where(eq(users.id, id));

      return true;
    } catch (error) {
      
      return false;
    }
  }

  // Rental Item operations - Implemented with Drizzle
  static async addRentalItem(data: {
    rentalId: number;
    equipmentId?: number | null;
    equipmentName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    days?: number;
    rateType?: string;
    operatorId?: number | null;
    status?: string;
    notes?: string;
  }) {
    try {
      const rentalItemRows = await db
        .insert(rentalItems)
        .values({
          rentalId: data.rentalId,
          equipmentId: data.equipmentId,
          equipmentName: data.equipmentName,
          unitPrice: data.unitPrice.toString(),
          totalPrice: data.totalPrice.toString(),
          days: data.days || 1,
          rateType: data.rateType || 'daily',
          operatorId: data.operatorId,
          status: data.status || 'active',
          notes: data.notes || '',
          createdAt: new Date().toISOString().split('T')[0],
          updatedAt: new Date().toISOString().split('T')[0],
        })
        .returning();

      return rentalItemRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async getRentalItems(rentalId: number) {
    try {
      const rentalItemRows = await db
        .select()
        .from(rentalItems)
        .where(eq(rentalItems.rentalId, rentalId))
        .orderBy(desc(rentalItems.createdAt));

      return rentalItemRows;
    } catch (error) {
      
      return [];
    }
  }

  static async getRentalItem(id: number) {
    try {
      const rentalItemRows = await db
        .select()
        .from(rentalItems)
        .where(eq(rentalItems.id, id))
        .limit(1);

      return rentalItemRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async updateRentalItem(
    id: number,
    data: {
      equipmentId?: number | null;
      equipmentName?: string;
      quantity?: number;
      unitPrice?: number;
      totalPrice?: number;
      days?: number;
      rateType?: string;
      operatorId?: number | null;
      status?: string;
      notes?: string;
    }
  ) {
    try {
      const updateData: any = {};

      if (data.equipmentId !== undefined) updateData.equipmentId = data.equipmentId;
      if (data.equipmentName !== undefined) updateData.equipmentName = data.equipmentName;
      if (data.quantity !== undefined) updateData.quantity = data.quantity;
      if (data.unitPrice !== undefined) updateData.unitPrice = data.unitPrice.toString();
      if (data.totalPrice !== undefined) updateData.totalPrice = data.totalPrice.toString();
      if (data.days !== undefined) updateData.days = data.days;
      if (data.rateType !== undefined) updateData.rateType = data.rateType;
      if (data.operatorId !== undefined) updateData.operatorId = data.operatorId;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.notes !== undefined) updateData.notes = data.notes;

      updateData.updatedAt = new Date().toISOString().split('T')[0];

      const rentalItemRows = await db
        .update(rentalItems)
        .set(updateData)
        .where(eq(rentalItems.id, id))
        .returning();

      return rentalItemRows[0] || null;
    } catch (error) {
      
      return null;
    }
  }

  static async deleteRentalItem(id: number) {
    try {
      await db.update(rentalItems).set({ status: 'deleted' }).where(eq(rentalItems.id, id));

      return true;
    } catch (error) {
      
      return false;
    }
  }
}
