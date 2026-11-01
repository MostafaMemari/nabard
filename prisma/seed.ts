import "dotenv/config";
import { hashSync } from "bcryptjs";
import { getServerEnv } from "../src/lib/env";
import { getPrisma } from "../src/lib/prisma";
import { ageCategories, belts, weightClasses } from "./data/base-data";

const prisma = getPrisma();

async function main() {
  const serverEnv = getServerEnv();

  for (const belt of belts) {
    await prisma.belt.upsert({
      where: { name: belt.name },
      update: { level: belt.level, order: belt.order, rankType: belt.rankType, color: belt.color, colorHex: belt.colorHex },
      create: {
        id: belt.id,
        name: belt.name,
        level: belt.level,
        order: belt.order,
        rankType: belt.rankType,
        color: belt.color,
        colorHex: belt.colorHex,
      },
    });
  }

  for (const category of ageCategories) {
    await prisma.ageCategory.upsert({
      where: { name: category.name },
      update: {
        startDate: new Date(category.startDate),
        endDate: new Date(category.endDate),
        birthYearStart: category.birthYearStart,
        birthYearEnd: category.birthYearEnd,
      },
      create: {
        id: category.id,
        name: category.name,
        startDate: new Date(category.startDate),
        endDate: new Date(category.endDate),
        birthYearStart: category.birthYearStart,
        birthYearEnd: category.birthYearEnd,
      },
    });
  }

  const weightClassCount = await prisma.weightClass.count();

  if (weightClassCount === 0) {
    await prisma.weightClass.createMany({
      data: weightClasses.map((weightClass) => ({
        id: weightClass.id,
        ageCategoryId: weightClass.ageCategoryId,
        gender: weightClass.gender,
        label: weightClass.label,
        minWeightKg: weightClass.minWeightKg,
        maxWeightKg: weightClass.maxWeightKg,
        order: weightClass.order,
        excludeMin: weightClass.excludeMin,
        excludeMax: weightClass.excludeMax,
      })),
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
    `داده های پایه آماده شدند: ${belts.length} کمربند، ${ageCategories.length} رده سنی، ${weightClasses.length} رده وزنی و یک حساب مدیر.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
