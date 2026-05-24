import path from 'path'
import dotenv from 'dotenv'
import { defineConfig } from 'prisma/config'
import { resolveDatabaseUrl } from './src/lib/database-url'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: resolveDatabaseUrl({
      databaseUrl: process.env.DATABASE_URL,
      directUrl: process.env.DIRECT_URL,
      allowPlaceholder: true,
    }),
  },
  migrations: {
    seed: 'npx ts-node --project prisma/tsconfig.seed.json prisma/seed.ts',
  },
})
