import { prisma } from './db'

export class DatabaseService {
  // Customer operations
  static async getCustomers() {
    return await prisma.customer.findMany({
      include: {
        rentals: true
      }
    })
  }

  static async getCustomerById(id: string) {
    return await prisma.customer.findUnique({
      where: { id },
      include: {
        rentals: {
          include: {
            rentalItems: {
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
    email: string
    phone?: string
    address?: string
    company?: string
  }) {
    return await prisma.customer.create({
      data
    })
  }

  static async updateCustomer(id: string, data: {
    name?: string
    email?: string
    phone?: string
    address?: string
    company?: string
  }) {
    return await prisma.customer.update({
      where: { id },
      data
    })
  }

  static async deleteCustomer(id: string) {
    return await prisma.customer.delete({
      where: { id }
    })
  }

  // Equipment operations
  static async getEquipment() {
    return await prisma.equipment.findMany({
      include: {
        rentalItems: {
          include: {
            rental: true
          }
        }
      }
    })
  }

  static async getEquipmentById(id: string) {
    return await prisma.equipment.findUnique({
      where: { id },
      include: {
        rentalItems: {
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

  static async updateEquipment(id: string, data: {
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

  static async deleteEquipment(id: string) {
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
        rentalItems: {
          include: {
            equipment: true
          }
        },
        payments: true,
        invoices: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  static async getRental(id: string) {
    return await prisma.rental.findUnique({
      where: { id },
      include: {
        customer: true,
        rentalItems: {
          include: {
            equipment: true
          }
        },
        payments: true,
        invoices: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
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
        rentalItems: rentalItems ? {
          create: rentalItems.map((item: any) => ({
            equipmentId: item.equipmentId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            days: item.days,
            rateType: item.rateType,
            operatorId: item.operatorId,
            status: item.status,
            notes: item.notes
          }))
        } : undefined,
        statusLogs: {
          create: {
            oldStatus: null,
            newStatus: 'pending',
            changedBy: 'system',
            reason: 'Rental created'
          }
        }
      },
      include: {
        customer: true,
        rentalItems: {
          include: {
            equipment: true
          }
        },
        payments: true,
        invoices: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    return rental
  }

  static async updateRental(id: string, data: {
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
        rentalItems: {
          include: {
            equipment: true
          }
        },
        payments: true,
        invoices: true,
        statusLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })
  }

  static async deleteRental(id: string) {
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

  static async getUserById(id: string) {
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
  }) {
    return await prisma.user.create({
      data
    })
  }

  static async updateUser(id: string, data: {
    email?: string
    name?: string
    role?: 'ADMIN' | 'USER' | 'MANAGER'
  }) {
    return await prisma.user.update({
      where: { id },
      data
    })
  }

  static async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id }
    })
  }
}
