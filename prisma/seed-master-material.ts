import { PrismaClient } from "@prisma/client";

import { seedPksMaterialMaster } from "./seed-lib/pt-pks-material-master";

const prisma = new PrismaClient();

const DEFAULT_COMPANY_CODE =
  process.env.SEED_MATERIAL_MASTER_COMPANY_CODE ?? "PT-PKS";
const DEFAULT_COMPANY_NAME =
  process.env.SEED_MATERIAL_MASTER_COMPANY_NAME ?? "PT Taro Rakaya Tasyra";

async function main() {
  console.log("🌱 Starting master material seed...");

  const company = await prisma.company.upsert({
    where: { code: DEFAULT_COMPANY_CODE },
    update: { name: DEFAULT_COMPANY_NAME },
    create: {
      code: DEFAULT_COMPANY_CODE,
      name: DEFAULT_COMPANY_NAME,
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  await seedPksMaterialMaster(prisma, company);
}

main()
  .catch((error) => {
    console.error("❌ Master material seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
