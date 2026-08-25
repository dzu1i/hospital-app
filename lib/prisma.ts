import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const ca = process.env.AIVEN_CA_CERT;

if (!ca) {
  throw new Error("Missing AIVEN_CA_CERT environment variable.");
}

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL_SECURE!,
  ssl: {
    ca,
    rejectUnauthorized: true,
  },
});

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
