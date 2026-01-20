const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const { Pool } = require('pg')
require('dotenv').config()

async function main() {
  console.log('Testing connection to:', process.env.DATABASE_URL)
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaPg(pool)
  const prisma = new PrismaClient({ adapter })

  try {
    const count = await prisma.weightEntry.count()
    console.log('Connecton successful! Weight entries count:', count)
  } catch (e) {
    console.error('Connection failed:', e)
  } finally {
    await pool.end()
  }
}

main()
