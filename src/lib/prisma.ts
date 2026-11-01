import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../generated/client";
import { getServerEnv } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient({
    adapter: new PrismaNeon({ connectionString: getServerEnv().DATABASE_URL }),
  });
  return globalForPrisma.prisma;
}
