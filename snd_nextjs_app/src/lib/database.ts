// Legacy database file - use @/lib/drizzle instead
import { eq, desc, asc, ilike, or, and, sql } from 'drizzle-orm'
import { db } from '@/lib/drizzle'
import { customers } from '@/lib/drizzle/schema'

export class DatabaseService {
  // Customer operations
  static async getCustomers(options?: {
    page?: number
    limit?: number
    search?: string
    status?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }) {
    const page = options?.page || 1
    const limit = options?.limit || 10
    const skip = (page - 1) * limit

    // Build filters (Drizzle)
    const filters: any[] = []
    if (options?.search) {
      const s = `%${options.search}%`
      filters.push(
        or(
          ilike(customers.name, s),
          ilike(customers.companyName, s),
          ilike(customers.contactPerson, s),
          ilike(customers.email, s),
          ilike(customers.phone, s),
        )
      )
    }
    if (options?.status) {
      filters.push(eq(customers.status, options.status))
    }
    const whereExpr = filters.length ? and(...filters) : undefined

    // Order by mapping
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder || 'desc'
    const orderCol = (() => {
      switch (sortBy) {
        case 'name': return customers.name
        case 'company_name': return customers.companyName
        case 'email': return customers.email
        case 'status': return customers.status
        case 'created_at':
        default: return customers.createdAt
      }
    })()

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(whereExpr as any)
    const totalCount = Number((totalRow as any)[0]?.count ?? 0)

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
      .limit(limit)

    return {
      customers: rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    }
  }

  static async getCustomerById(id: number) {
    const customerRows = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id))
      .limit(1)
    
    return customerRows[0] || null
  }

  static async createCustomer(data: {
    name: string
    email?: string
    phone?: string
    address?: string
    company_name?: string
    contact_person?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    website?: string
    tax_number?: string
    credit_limit?: number
    payment_terms?: string
    notes?: string
    is_active?: boolean
    erpnext_id?: string
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
      .returning()
    return inserted[0]
  }

  static async updateCustomer(id: number, data: {
    name?: string
    email?: string
    phone?: string
    address?: string
    company_name?: string
    contact_person?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
    website?: string
    tax_number?: string
    credit_limit?: number
    payment_terms?: string
    notes?: string
    is_active?: boolean
    erpnext_id?: string
  }) {
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
      .returning()
    return updated[0]
  }

  static async deleteCustomer(id: number) {
    await db.delete(customers).where(eq(customers.id, id))
    return true
  }

  static async getCustomerStatistics() {
    const [totalRow, activeRow, syncedRow, localOnlyRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customers),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(eq(customers.isActive, true as any)),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(sql`erpnext_id is not null` as any),
      db.select({ count: sql<number>`count(*)` }).from(customers).where(sql`erpnext_id is null` as any),
    ])
    const totalCustomers = Number((totalRow as any)[0]?.count ?? 0)
    const activeCustomers = Number((activeRow as any)[0]?.count ?? 0)
    const erpnextSyncedCustomers = Number((syncedRow as any)[0]?.count ?? 0)
    const localOnlyCustomers = Number((localOnlyRow as any)[0]?.count ?? 0)

    return { totalCustomers, activeCustomers, erpnextSyncedCustomers, localOnlyCustomers }
  }

  // Note: The following methods were using Prisma and need to be implemented with Drizzle
  // For now, they return null to indicate they need proper implementation
  
  static async syncCustomerFromERPNext(erpnextId: string, customerData: any) {
    // TODO: Implement with Drizzle
    console.warn('syncCustomerFromERPNext not yet implemented with Drizzle')
    return null
  }

  static async getCustomerByERPNextId(erpnextId: string) {
    // TODO: Implement with Drizzle
    console.warn('getCustomerByERPNextId not yet implemented with Drizzle')
    return null
  }

  // Equipment operations - TODO: Implement with Drizzle
  static async getEquipment() {
    console.warn('getEquipment not yet implemented with Drizzle')
    return []
  }

  static async getEquipmentById(id: number) {
    console.warn('getEquipmentById not yet implemented with Drizzle')
    return null
  }

  static async createEquipment(data: {
    name: string
    description?: string
    category: string
    dailyRate: number
  }) {
    console.warn('createEquipment not yet implemented with Drizzle')
    return null
  }

  static async updateEquipment(id: number, data: {
    name?: string
    description?: string
    category?: string
    status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED'
    dailyRate?: number
  }) {
    console.warn('updateEquipment not yet implemented with Drizzle')
    return null
  }

  static async deleteEquipment(id: number) {
    console.warn('deleteEquipment not yet implemented with Drizzle')
    return false
  }

  // Rental operations - TODO: Implement with Drizzle 
  static async getRentals(filters?: {
    search?: string
    status?: string
    customerId?: string
    paymentStatus?: string
    startDate?: string
    endDate?: string
  }) {
    console.warn('getRentals not yet implemented with Drizzle')
    return []
  }

  static async getRental(id: number) {
    console.warn('getRental not yet implemented with Drizzle')
    return null
  }

  static async createRental(data: {
    customerId: number
    rentalNumber: string
    startDate: Date
    expectedEndDate?: Date
    actualEndDate?: Date
    status?: string
    paymentStatus?: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE'
    subtotal?: number
    taxAmount?: number
    totalAmount: number
    discount?: number
    tax?: number
    finalAmount?: number
    depositAmount?: number
    paymentTermsDays?: number
    hasTimesheet?: boolean
    hasOperators?: boolean
    notes?: string
    rentalItems?: any[]
  }) {
    console.warn('createRental not yet implemented with Drizzle')
    return null
  }

  static async updateRental(id: number, data: {
    customerId?: number
    rentalNumber?: string
    startDate?: Date
    expectedEndDate?: Date | null
    actualEndDate?: Date | null
    status?: string
    paymentStatus?: string
    subtotal?: number
    taxAmount?: number
    totalAmount?: number
    discount?: number
    tax?: number
    finalAmount?: number
    depositAmount?: number
    paymentTermsDays?: number
    hasTimesheet?: boolean
    hasOperators?: boolean
    notes?: string
    rentalItems?: any[]
    approvedAt?: string
    mobilizationDate?: string
    completedAt?: string
    invoiceDate?: string
  }) {
    console.warn('updateRental not yet implemented with Drizzle')
    return null
  }

  static async deleteRental(id: number) {
    console.warn('deleteRental not yet implemented with Drizzle')
    return false
  }

  // User operations - TODO: Implement with Drizzle
  static async getUsers() {
    console.warn('getUsers not yet implemented with Drizzle')
    return []
  }

  static async getUserById(id: number) {
    console.warn('getUserById not yet implemented with Drizzle')
    return null
  }

  static async getUserByEmail(email: string) {
    console.warn('getUserByEmail not yet implemented with Drizzle')
    return null
  }

  static async createUser(data: {
    email: string
    name?: string
    role?: 'ADMIN' | 'USER' | 'MANAGER' | 'SUPER_ADMIN'
    password: string
  }) {
    console.warn('createUser not yet implemented with Drizzle')
    return null
  }

  static async updateUser(id: number, data: {
    email?: string
    name?: string
    role?: 'ADMIN' | 'USER' | 'MANAGER' | 'SUPER_ADMIN'
  }) {
    console.warn('updateUser not yet implemented with Drizzle')
    return null
  }

  static async deleteUser(id: number) {
    console.warn('deleteUser not yet implemented with Drizzle')
    return false
  }

  // Rental Item operations - TODO: Implement with Drizzle
  static async addRentalItem(data: {
    rentalId: number
    equipmentId?: number | null
    equipmentName: string
    quantity: number
    unitPrice: number
    totalPrice: number
    days?: number
    rateType?: string
    operatorId?: number | null
    status?: string
    notes?: string
  }) {
    console.warn('addRentalItem not yet implemented with Drizzle')
    return null
  }

  static async getRentalItems(rentalId: number) {
    console.warn('getRentalItems not yet implemented with Drizzle')
    return []
  }

  static async getRentalItem(id: number) {
    console.warn('getRentalItem not yet implemented with Drizzle')
    return null
  }

  static async updateRentalItem(id: number, data: {
    equipmentId?: number | null
    equipmentName?: string
    quantity?: number
    unitPrice?: number
    totalPrice?: number
    days?: number
    rateType?: string
    operatorId?: number | null
    status?: string
    notes?: string
  }) {
    console.warn('updateRentalItem not yet implemented with Drizzle')
    return null
  }

  static async deleteRentalItem(id: number) {
    console.warn('deleteRentalItem not yet implemented with Drizzle')
    return false
  }
}
