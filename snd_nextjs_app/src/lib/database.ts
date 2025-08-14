import { db, prisma } from './db'
import { rentals, rentalItems, equipment as equipmentTable, customers as customersTable } from '@/lib/drizzle/schema'
import { eq, desc, asc, ilike, or, and, sql } from 'drizzle-orm'

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
          ilike(customersTable.name, s),
          ilike(customersTable.companyName, s),
          ilike(customersTable.contactPerson, s),
          ilike(customersTable.email, s),
          ilike(customersTable.phone, s),
        )
      )
    }
    if (options?.status) {
      filters.push(eq(customersTable.status, options.status))
    }
    const whereExpr = filters.length ? and(...filters) : undefined

    // Order by mapping
    const sortBy = options?.sortBy || 'created_at'
    const sortOrder = options?.sortOrder || 'desc'
    const orderCol = (() => {
      switch (sortBy) {
        case 'name': return customersTable.name
        case 'company_name': return customersTable.companyName
        case 'email': return customersTable.email
        case 'status': return customersTable.status
        case 'created_at':
        default: return customersTable.createdAt
      }
    })()

    const totalRow = await db
      .select({ count: sql<number>`count(*)` })
      .from(customersTable)
      .where(whereExpr as any)
    const totalCount = Number((totalRow as any)[0]?.count ?? 0)

    const rows = await db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        contact_person: customersTable.contactPerson,
        email: customersTable.email,
        phone: customersTable.phone,
        address: customersTable.address,
        city: customersTable.city,
        state: customersTable.state,
        postal_code: customersTable.postalCode,
        country: customersTable.country,
        website: customersTable.website,
        tax_number: customersTable.taxNumber,
        credit_limit: customersTable.creditLimit,
        payment_terms: customersTable.paymentTerms,
        notes: customersTable.notes,
        is_active: customersTable.isActive,
        company_name: customersTable.companyName,
        erpnext_id: customersTable.erpnextId,
        status: customersTable.status,
        created_at: customersTable.createdAt,
        updated_at: customersTable.updatedAt,
      })
      .from(customersTable)
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
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        rentals: {
          include: {
            rental_items: {
              include: {
                equipment: true
              }
            }
          }
        }
      }
    })
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
      .insert(customersTable)
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
        creditLimit: (data.credit_limit as any) ?? null,
        paymentTerms: data.payment_terms ?? null,
        notes: data.notes ?? null,
        isActive: data.is_active ?? true,
        erpnextId: data.erpnext_id ?? null,
        status: 'active',
        updatedAt: new Date().toISOString(),
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
      .update(customersTable)
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
        creditLimit: (data.credit_limit as any) ?? undefined,
        paymentTerms: data.payment_terms ?? undefined,
        notes: data.notes ?? undefined,
        isActive: data.is_active ?? undefined,
        erpnextId: data.erpnext_id ?? undefined,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(customersTable.id, id))
      .returning()
    return updated[0]
  }

  static async deleteCustomer(id: number) {
    await db.delete(customersTable).where(eq(customersTable.id, id))
    return true
  }

  static async getCustomerStatistics() {
    const [totalRow, activeRow, syncedRow, localOnlyRow] = await Promise.all([
      db.select({ count: sql<number>`count(*)` }).from(customersTable),
      db.select({ count: sql<number>`count(*)` }).from(customersTable).where(eq(customersTable.isActive, true as any)),
      db.select({ count: sql<number>`count(*)` }).from(customersTable).where(sql`erpnext_id is not null` as any),
      db.select({ count: sql<number>`count(*)` }).from(customersTable).where(sql`erpnext_id is null` as any),
    ])
    const totalCustomers = Number((totalRow as any)[0]?.count ?? 0)
    const activeCustomers = Number((activeRow as any)[0]?.count ?? 0)
    const erpnextSyncedCustomers = Number((syncedRow as any)[0]?.count ?? 0)
    const localOnlyCustomers = Number((localOnlyRow as any)[0]?.count ?? 0)

    return { totalCustomers, activeCustomers, erpnextSyncedCustomers, localOnlyCustomers }
  }

  static async syncCustomerFromERPNext(erpnextId: string, customerData: any) {
    return await prisma.customer.upsert({
      where: { erpnext_id: erpnextId },
      update: customerData,
      create: customerData,
    })
  }

  static async getCustomerByERPNextId(erpnextId: string) {
    return await prisma.customer.findFirst({
      where: { erpnext_id: erpnextId },
      include: {
        rentals: true
      }
    })
  }

  // Equipment operations
  static async getEquipment() {
    return await prisma.equipment.findMany({
      include: {
        rental_items: {
          include: {
            rental: true
          }
        }
      }
    })
  }

  static async getEquipmentById(id: number) {
    return await prisma.equipment.findUnique({
      where: { id },
      include: {
        rental_items: {
          include: {
            rental: {
              include: {
                customer: true
              }
            }
          }
        }
      }
    })
  }

  static async createEquipment(data: {
    name: string
    description?: string
    category: string
    dailyRate: number
  }) {
    return await prisma.equipment.create({
      data
    })
  }

  static async updateEquipment(id: number, data: {
    name?: string
    description?: string
    category?: string
    status?: 'AVAILABLE' | 'RENTED' | 'MAINTENANCE' | 'RETIRED'
    dailyRate?: number
  }) {
    return await prisma.equipment.update({
      where: { id },
      data
    })
  }

  static async deleteEquipment(id: number) {
    return await prisma.equipment.delete({
      where: { id }
    })
  }

  // Rental operations
  static async getRentals(filters?: {
    search?: string
    status?: string
    customerId?: string
    paymentStatus?: string
    startDate?: string
    endDate?: string
  }) {
    const where: any = {}

    if (filters?.search) {
      where.OR = [
        { rentalNumber: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
      ]
    }

    if (filters?.status) {
      where.status = filters.status
    }

    if (filters?.customerId) {
      where.customerId = filters.customerId
    }

    if (filters?.paymentStatus) {
      where.paymentStatus = filters.paymentStatus
    }

    if (filters?.startDate) {
      where.startDate = { gte: new Date(filters.startDate) }
    }

    if (filters?.endDate) {
      where.expectedEndDate = { lte: new Date(filters.endDate) }
    }

    return await prisma.rental.findMany({
      where,
      include: {
        customer: true,
        rental_items: {
          include: {
            equipment: true
          }
        }
      },
      orderBy: { created_at: 'desc' }
    })
  }

  static async getRental(id: number) {
    return await prisma.rental.findUnique({
      where: { id },
      include: {
        customer: true,
        rental_items: {
          include: {
            equipment: true
          }
        },

      }
    })
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
    const { rentalItems, ...rentalData } = data

    const rental = await prisma.rental.create({
      data: {
        customer_id: rentalData.customerId,
        rental_number: rentalData.rentalNumber || `RENTAL-${Date.now()}`,
        start_date: rentalData.startDate || new Date(),
        expected_end_date: rentalData.expectedEndDate,
        actual_end_date: rentalData.actualEndDate,
        status: rentalData.status || 'pending',
        payment_status: rentalData.paymentStatus || 'pending',
        subtotal: rentalData.subtotal || 0,
        tax_amount: rentalData.taxAmount || 0,
        total_amount: rentalData.totalAmount || 0,
        discount: rentalData.discount || 0,
        tax: rentalData.tax || 0,
        final_amount: rentalData.finalAmount || 0,
        deposit_amount: rentalData.depositAmount || 0,
        payment_terms_days: rentalData.paymentTermsDays || 30,
        has_timesheet: rentalData.hasTimesheet || false,
        has_operators: rentalData.hasOperators || false,
        notes: rentalData.notes || '',
        rental_items: rentalItems ? {
          create: rentalItems.map((item: any) => ({
            equipment_id: item.equipmentId ? parseInt(item.equipmentId) : null,
            equipment_name: item.equipmentName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            days: item.days,
            rate_type: item.rateType,
            operator_id: item.operatorId ? parseInt(item.operatorId) : null,
            status: item.status || 'active',
            notes: item.notes
          }))
        } : undefined,
      },
      include: {
        customer: true,
        rental_items: {
          include: {
            equipment: true
          }
        }
      }
    })

    return rental
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
    const { rentalItems, ...rentalData } = data

    // Handle null values for dates
    const updateData: any = { ...rentalData }
    if (updateData.expectedEndDate === null) {
      updateData.expectedEndDate = null
    }
    if (updateData.actualEndDate === null) {
      updateData.actualEndDate = null
    }



    return await prisma.rental.update({
      where: { id },
      data: {
        customer_id: updateData.customerId,
        rental_number: updateData.rentalNumber,
        start_date: updateData.startDate,
        expected_end_date: updateData.expectedEndDate,
        actual_end_date: updateData.actualEndDate,
        status: updateData.status,
        payment_status: updateData.paymentStatus,
        subtotal: updateData.subtotal || 0,
        tax_amount: updateData.taxAmount || 0,
        total_amount: updateData.totalAmount || 0,
        discount: updateData.discount || 0,
        tax: updateData.tax || 0,
        final_amount: updateData.finalAmount || 0,
        deposit_amount: updateData.depositAmount || 0,
        payment_terms_days: updateData.paymentTermsDays,
        has_timesheet: updateData.hasTimesheet,
        has_operators: updateData.hasOperators,
        notes: updateData.notes,
        rental_items: rentalItems ? {
          deleteMany: {},
          create: rentalItems.map((item: any) => ({
            equipment_id: item.equipmentId ? parseInt(item.equipmentId) : null,
            equipment_name: item.equipmentName,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            days: item.days,
            rate_type: item.rateType,
            operator_id: item.operatorId ? parseInt(item.operatorId) : null,
            status: item.status || 'active',
            notes: item.notes
          }))
        } : undefined,
      },
      include: {
        customer: true,
        rental_items: {
          include: {
            equipment: true
          }
        }
      }
    })
  }

  static async deleteRental(id: number) {
    try {
      await prisma.rental.delete({
      where: { id }
    })
      return true
    } catch (error) {
      console.error('Error deleting rental:', error)
      return false
    }
  }

  // User operations
  static async getUsers() {
    return await prisma.user.findMany()
  }

  static async getUserById(id: number) {
    return await prisma.user.findUnique({
      where: { id }
    })
  }

  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email }
    })
  }

  static async createUser(data: {
    email: string
    name?: string
    role?: 'ADMIN' | 'USER' | 'MANAGER' | 'SUPER_ADMIN'
    password: string
  }) {
    return await prisma.user.create({
      data: {
        ...data,
        name: data.name || 'Unknown User'
      }
    })
  }

  static async updateUser(id: number, data: {
    email?: string
    name?: string
    role?: 'ADMIN' | 'USER' | 'MANAGER' | 'SUPER_ADMIN'
  }) {
    return await prisma.user.update({
      where: { id },
      data
    })
  }

  static async deleteUser(id: number) {
    return await prisma.user.delete({
      where: { id }
    })
  }

  // Rental Item operations
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
    try {
      const result = await prisma.rentalItem.create({
        data: {
          rental_id: data.rentalId,
          equipment_id: data.equipmentId,
          equipment_name: data.equipmentName,
          quantity: data.quantity,
          unit_price: data.unitPrice,
          total_price: data.totalPrice,
          days: data.days || 1,
          rate_type: data.rateType || 'daily',
          operator_id: data.operatorId,
          status: data.status || 'active',
          notes: data.notes || '',
        },
        include: {
          equipment: true
        }
      });
      
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getRentalItems(rentalId: number) {
    return await prisma.rentalItem.findMany({
      where: { rental_id: rentalId },
      include: {
        equipment: true
      },
      orderBy: { created_at: 'desc' }
    })
  }

  static async getRentalItem(id: number) {
    return await prisma.rentalItem.findUnique({
      where: { id },
      include: {
        equipment: true
      }
    })
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
    return await prisma.rentalItem.update({
      where: { id },
      data: {
        equipment_id: data.equipmentId,
        equipment_name: data.equipmentName,
        quantity: data.quantity,
        unit_price: data.unitPrice,
        total_price: data.totalPrice,
        days: data.days,
        rate_type: data.rateType,
        operator_id: data.operatorId,
        status: data.status,
        notes: data.notes,
      },
      include: {
        equipment: true
      }
    })
  }

  static async deleteRentalItem(id: number) {
    return await prisma.rentalItem.delete({
      where: { id }
    })
  }
}
