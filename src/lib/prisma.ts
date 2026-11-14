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
    ? // The local wire server serves one backend at a time; a pooled client
      // would tear down its extra connections mid-query.
      new PrismaPg({ connectionString, max: 1 })
    : new PrismaNeon({ connectionString });
}

export function getPrisma(): PrismaClient {
  globalForPrisma.prisma ??= new PrismaClient({ adapter: createAdapter() });
  return globalForPrisma.prisma;
}
