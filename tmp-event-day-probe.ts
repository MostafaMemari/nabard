import { SignJWT } from "jose";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "./src/generated/client";

const DATABASE_URL = process.env.DATABASE_URL as string;
const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: DATABASE_URL }) });

async function main() {
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", isActive: true }, orderBy: { createdAt: "asc" } });
  if (!admin) throw new Error("no active admin found");
  if (!admin.province) throw new Error("admin has no province");

  const competition = await prisma.competition.findFirst({
    where: { province: admin.province, status: "PUBLISHED", discipline: "KYORUGI", registrations: { some: { status: "APPROVED" } } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, eventDate: true, rulesSnapshot: true },
  });

  const superAdmin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN", isActive: true }, select: { id: true } });

  const registrations = competition
    ? await prisma.registration.findMany({
        where: { competitionId: competition.id, status: "APPROVED" },
        select: {
          id: true,
          weightClassId: true,
          weightClassLabel: true,
          weighInVerdict: true,
          checkInAt: true,
          student: { select: { fullName: true } },
        },
        take: 5,
      })
    : [];

  const value = `${DATABASE_URL}\nnabard.session.v1`;
  const key = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
  const adminToken = await new SignJWT({ role: "ADMIN" }).setProtectedHeader({ alg: "HS256" }).setSubject(admin.id).setIssuedAt().setExpirationTime("3600s").sign(key);
  const superToken = superAdmin ? await new SignJWT({ role: "SUPER_ADMIN" }).setProtectedHeader({ alg: "HS256" }).setSubject(superAdmin.id).setIssuedAt().setExpirationTime("3600s").sign(key) : null;

  console.log(
    JSON.stringify(
      {
        adminId: admin.id,
        adminProvince: admin.province,
        competition,
        registrations,
        superAdminId: superAdmin?.id ?? null,
        adminToken,
        superToken,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
