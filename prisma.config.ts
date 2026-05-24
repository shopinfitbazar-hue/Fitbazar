import path from 'path'
import dotenv from 'dotenv'
import { defineConfig, env } from 'prisma/config'

dotenv.config({ path: '.env.local' })

export default defineConfig({
  schema: path.join('prisma', 'schema.prisma'),
  datasource: {
    url: env('DIRECT_URL'),
  },
  migrations: {
    seed: 'npx ts-node --project prisma/tsconfig.seed.json prisma/seed.ts',
  },
})
