import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

let prismaInstance: any;

const createPrismaClient = () => {
  if (typeof window !== 'undefined') return null;
  
  if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL not found, Prisma is disabled.");
    return null;
  }

  try {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  } catch (error) {
    console.error("Failed to initialize Prisma:", error);
    return null;
  }
};

export const prisma = prismaInstance || (prismaInstance = createPrismaClient());