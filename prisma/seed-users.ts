import { PrismaClient } from "@prisma/client";

import { seedPksUsers } from "./seed-lib/pt-pks-users-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting user seed...");
  await seedPksUsers(prisma);
}

main()
  .catch((error) => {
    console.error("❌ User seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
