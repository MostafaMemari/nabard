import "dotenv/config";
import { hashSync } from "bcryptjs";
import { getServerEnv } from "../src/lib/env";
import { getPrisma } from "../src/lib/prisma";
import { tehranCounties } from "./data/counties";
import { seedBaseData } from "./seed-base-data";

const prisma = getPrisma();

async function main() {
  const serverEnv = getServerEnv();

  const baseData = await seedBaseData(prisma);

  for (const name of tehranCounties) {
    await prisma.county.upsert({
      where: { province_name: { province: "TEHRAN", name } },
      update: {},
      create: { province: "TEHRAN", name },
    });
  }

  if (!serverEnv.ADMIN_MOBILE || !serverEnv.ADMIN_PASSWORD || !serverEnv.ADMIN_PROVINCE) {
    throw new Error("ADMIN_MOBILE, ADMIN_PASSWORD and ADMIN_PROVINCE are required for seeding.");
  }

  const passwordHash = hashSync(serverEnv.ADMIN_PASSWORD, 10);

  await prisma.user.upsert({
    where: { mobile: serverEnv.ADMIN_MOBILE },
    update: { passwordHash, role: "ADMIN", province: serverEnv.ADMIN_PROVINCE, isActive: true },
    create: {
      mobile: serverEnv.ADMIN_MOBILE,
      passwordHash,
      fullName: "مدیر سامانه",
      nationalCode: null,
      role: "ADMIN",
      province: serverEnv.ADMIN_PROVINCE,
      isActive: true,
    },
  });

  console.log(
    `داده های پایه آماده شدند: ${baseData.belts} کمربند، ${baseData.ageCategories} رده سنی، ${baseData.weightClasses} رده وزنی (جدید) و ${tehranCounties.length} شهرستان استان تهران و یک حساب مدیر.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
