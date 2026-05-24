import path from 'path'
import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'

dotenv.config({ path: '.env.local' })

const fallbackDatabaseUrl = 'postgresql://placeholder:placeholder@localhost:5432/fitbazar?schema=public'

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || fallbackDatabaseUrl,
  },
  migrations: {
    seed: 'npx ts-node --project prisma/tsconfig.seed.json prisma/seed.ts',
  },
})
