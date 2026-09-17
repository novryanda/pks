import bcrypt from "bcryptjs";
import type { PrismaClient } from "@prisma/client";

import { ptPksUserSeeds } from "../seed-data/pt-pks-users";

const DEFAULT_USER_PASSWORD = "password123";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function seedPksUsers(prisma: PrismaClient) {
  console.log("👤 Seeding user PT PKS...");

  const company = await prisma.company.findUnique({
    where: { code: "PT-PKS" },
    select: { id: true, code: true },
  });

  if (!company) {
    throw new Error("Company PT-PKS tidak ditemukan untuk seed user");
  }

  const roles = await prisma.role.findMany({
    where: { companyId: company.id },
    select: { id: true, name: true },
  });

  const roleMap = new Map(roles.map((role) => [role.name, role.id]));
  const hashedPassword = await bcrypt.hash(DEFAULT_USER_PASSWORD, 12);

  for (const user of ptPksUserSeeds) {
    const roleId = roleMap.get(user.roleName);

    if (!roleId) {
      throw new Error(
        `Role ${user.roleName} tidak ditemukan untuk user ${user.email}`
      );
    }

    await prisma.user.upsert({
      where: { email: normalizeEmail(user.email) },
      update: {
        name: user.name,
        password: hashedPassword,
        emailVerified: new Date(),
        companyId: company.id,
        roleId,
      },
      create: {
        name: user.name,
        email: normalizeEmail(user.email),
        password: hashedPassword,
        emailVerified: new Date(),
        companyId: company.id,
        roleId,
      },
    });
  }

  const seededUsers = await prisma.user.count({
    where: {
      companyId: company.id,
      email: {
        in: ptPksUserSeeds.map((user) => normalizeEmail(user.email)),
      },
    },
  });

  console.log(`✅ User PT PKS tersimpan: ${seededUsers}`);
}
