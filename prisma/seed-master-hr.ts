import { PrismaClient } from "@prisma/client";

import { seedMasterHr } from "./seed-lib/master-hr-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting master HR seed...");
  await seedMasterHr(prisma);
}

main()
  .catch((error) => {
    console.error("❌ Master HR seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
