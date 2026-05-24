import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import { createRequire } from 'module'
import { maskDatabaseUrl, resolveDatabaseUrl } from '@/lib/database-url'

process.env.WS_NO_BUFFER_UTIL = '1'
process.env.WS_NO_UTF_8_VALIDATE = '1'

const require = createRequire(import.meta.url)
const ws = require('ws')

neonConfig.webSocketConstructor = ws
neonConfig.poolQueryViaFetch = false

const connectionString = resolveDatabaseUrl({
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
})

const adapter = new PrismaNeon({ connectionString })

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
    })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

if (process.env.NODE_ENV !== 'production') {
    console.info({
        message: 'Prisma runtime configured',
        databaseUrl: maskDatabaseUrl(connectionString),
    })
}
