import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/client";
import { getServerEnv } from "./env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// The Neon adapter talks HTTP to the Neon proxy; a plain local Postgres (pnpm dev
// against localhost) needs the regular pg adapter over TCP.
function createAdapter(): PrismaNeon | PrismaPg {
  const connectionString = getServerEnv().DATABASE_URL;
  const host = new URL(connectionString).hostname;

  return host === "localhost" || host === "127.0.0.1" || host === "::1"
    ? new PrismaPg({ connectionString })
    : new PrismaNeon({ connectionString });
}

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient({ adapter: createAdapter() });
  return globalForPrisma.prisma;
}
