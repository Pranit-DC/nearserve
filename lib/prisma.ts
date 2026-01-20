/**
 * This file is deprecated and no longer used.
 * The project uses Firestore (Firebase) instead of Prisma for data persistence.
 * Keeping this file for reference only - it can be safely deleted.
 */

export {};
};

const prisma = globalForPrisma.prisma ?? prismaClientSinglton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
export default prisma;
