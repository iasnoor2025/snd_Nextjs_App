import { prisma } from './db'

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

    // Build where clause
    const where: any = {}
    
    if (options?.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { company_name: { contains: options.search, mode: 'insensitive' } },
        { contact_person: { contains: options.search, mode: 'insensitive' } },
        { email: { contains: options.search, mode: 'insensitive' } },
        { phone: { contains: options.search, mode: 'insensitive' } },
      ]
    }

    if (options?.status) {
      where.status = options.status
    }

    // Build orderBy clause
    const orderBy: any = {}
    if (options?.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'asc'
    } else {
      orderBy.created_at = 'desc'
    }

    // Get total count for pagination
    const totalCount = await prisma.customer.count({ where })

    // Get paginated results
    const customers = await prisma.customer.findMany({
      where,
      include: {
        rentals: true
      },
      orderBy,
      skip,
      take: limit,
    })

    return {
      customers,
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
    return await prisma.customer.create({
      data
    })
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
    return await prisma.customer.update({
      where: { id },
      data
    })
  }

  static async deleteCustomer(id: number) {
    return await prisma.customer.delete({
      where: { id }
    })
  }

  static async getCustomerStatistics() {
    const [
      totalCustomers,
      activeCustomers,
      erpnextSyncedCustomers,
      localOnlyCustomers
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { is_active: true } }),
      prisma.customer.count({ where: { erpnext_id: { not: null } } }),
      prisma.customer.count({ where: { erpnext_id: null } })
    ])

    return {
      totalCustomers,
      activeCustomers,
      erpnextSyncedCustomers,
      localOnlyCustomers
    }
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
    customerId: string
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
        ...rentalData,
        rental_number: rentalData.rentalNumber || `RENTAL-${Date.now()}`,
        start_date: rentalData.startDate || new Date(),
        rental_items: rentalItems ? {
          create: rentalItems.map((item: any) => ({
            equipment_id: item.equipmentId,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total_price: item.totalPrice,
            days: item.days,
            rate_type: item.rateType,
            operator_id: item.operatorId,
            status: item.status,
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
    customerId?: string
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

    // Get current rental to determine old status
    const currentRental = await prisma.rental.findUnique({
      where: { id },
      select: { status: true }
    });

    // Determine workflow action for status log
    let newStatus = currentRental?.status || 'pending'
    let reason = 'Rental updated'

    if (data.approvedAt) {
      newStatus = 'approved'
      reason = 'Quotation approved by customer'
    } else if (data.mobilizationDate) {
      newStatus = 'mobilization'
      reason = 'Equipment mobilization started'
    } else if (data.status === 'active') {
      newStatus = 'active'
      reason = 'Rental activated and in progress'
    } else if (data.status === 'completed') {
      newStatus = 'completed'
      reason = 'Rental completed successfully'
    } else if (data.invoiceDate) {
      newStatus = currentRental?.status || 'completed'
      reason = 'Invoice generated for rental'
    } else if (data.status) {
      newStatus = data.status
      reason = `Status changed to ${data.status}`
    }

    return await prisma.rental.update({
      where: { id },
      data: {
        ...updateData,
        statusLogs: {
          create: {
            oldStatus: currentRental?.status || null,
            newStatus,
            changedBy: 'user',
            reason
          }
        }
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
    role?: 'ADMIN' | 'USER' | 'MANAGER'
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
    role?: 'ADMIN' | 'USER' | 'MANAGER'
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
}
