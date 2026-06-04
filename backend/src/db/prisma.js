import PrismaClient from '@prisma/client'
import { DATABASE_URL } from '../config/index.js';
const { PrismaClient: Prisma } = PrismaClient;

const prisma = new Prisma({
  datasources: {
    db: { url: DATABASE_URL }
  }});

export default prisma;