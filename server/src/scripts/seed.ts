import "dotenv/config";
import { prisma } from "../config/database.js";
import bcrypt from "bcrypt";

async function main(): Promise<void> {
  const SALT_ROUNDS = 12;
  const PASSWORD = "correcthorsebatterystaple";
  const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

  const nguyen = await prisma.family.upsert({
    where: { slug: "nguyen" },
    update: {},
    create: { slug: "nguyen", name: "Nguyễn" },
  });
  const tran = await prisma.family.upsert({
    where: { slug: "tran" },
    update: {},
    create: { slug: "tran", name: "Trần" },
  });

  for (const [email, familyId, role] of [
    ["an@example.com", nguyen.id, "owner"],
    ["binh@example.com", tran.id, "member"],
  ] as const) {
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash },
    });
    await prisma.familyMember.upsert({
      where: { userId_familyId: { userId: user.id, familyId } },
      update: { role },
      create: { userId: user.id, familyId, role },
    });
  }

  console.log(`seeded; every seeded user's password is "${PASSWORD}"`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
