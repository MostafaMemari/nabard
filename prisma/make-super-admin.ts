import "dotenv/config";
import { normalizeDigits } from "../src/lib/format";
import { getPrisma } from "../src/lib/prisma";

function argumentValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) return undefined;
  return process.argv[index + 1];
}

async function main() {
  const mobile = argumentValue("--mobile");
  const confirmed = process.argv.includes("--yes");

  if (!mobile || !confirmed) {
    console.error("استفاده: pnpm db:make-super-admin -- --mobile <شماره همراه> --yes");
    process.exit(1);
  }

  const prisma = getPrisma();
  const matched = await prisma.user.count({ where: { mobile: normalizeDigits(mobile) } });
  const promoted = await prisma.user.updateMany({
    where: { mobile: normalizeDigits(mobile) },
    data: { role: "SUPER_ADMIN", province: null },
  });

  console.log(JSON.stringify({ matched, promoted: promoted.count }));
}

main()
  .then(async () => getPrisma().$disconnect())
  .catch(async (error) => {
    console.error(error);
    await getPrisma().$disconnect();
    process.exit(1);
  });
