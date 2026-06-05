import { PrismaClient } from '@prisma/client';
import config from '../config/index.js';

const prisma = new PrismaClient({
  datasources: {
    db: { url: config.DATABASE_URL }
  }
});

export default prisma;