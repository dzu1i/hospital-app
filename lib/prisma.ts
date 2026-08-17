import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const ca = fs.readFileSync(
  path.join(process.cwd(), "certs", "ca.pem"),
  "utf8"
);

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