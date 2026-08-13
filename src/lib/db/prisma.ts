import { PrismaClient } from '@prisma/client'

/**
 * Database adapter selection.
 *
 * - SQLite (default, development): uses the libsql driver adapter with
 *   `file:./dev.db`
 * - PostgreSQL (production): uses the pg driver adapter when
 *   DATABASE_URL starts with `postgresql://` or `postgres://`
 *
 * Set DATABASE_URL accordingly in your environment.
 */
const url = process.env.DATABASE_URL || 'file:./dev.db'
const isPostgres = url.startsWith('postgresql://') || url.startsWith('postgres://')

let adapter

if (isPostgres) {
  // Dynamic import so SQLite deps aren't required in prod-only PG deploys
  const { PrismaPg } = await import('@prisma/adapter-pg')
  adapter = new PrismaPg({ connectionString: url })
} else {
  const { PrismaLibSql } = await import('@prisma/adapter-libsql')
  adapter = new PrismaLibSql({ url })
}

const prismaClientSingleton = () => {
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
