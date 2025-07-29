import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Set default database URL if not provided
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgres://postgres:fAfab9Ckow7o3yp2EhryEYKzHbyeMifPBHxi8Xb4f9sdnBgMI47Ytdaq2NWDCxy5@192.168.8.4:5432/snd_nextjs_db'
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
