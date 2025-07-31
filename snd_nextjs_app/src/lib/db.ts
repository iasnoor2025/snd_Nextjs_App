import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Set default database URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db'
}

// Create Prisma client with connection handling
const createPrismaClient = () => {
  const client = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      }
    }
  })

  // Add connection error handling
  client.$connect()
    .then(() => {
    
    })
    .catch((error) => {
      console.error('❌ Prisma client connection failed:', error)
    })

  return client
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
