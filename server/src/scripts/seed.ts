import "dotenv/config";
import { prisma } from "../config/database.js";

import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;
const PASSWORD = "correcthorsebatterystaple";
const passwordHash = await bcrypt.hash(PASSWORD, SALT_ROUNDS);

async function main(): Promise<void> {
  const family = await prisma.family.upsert({
    where: { slug: "nguyen" },
    update: {},
    create: { slug: "nguyen", name: "Nguyễn" },
  });

  await prisma.person.deleteMany({ where: { familyId: family.id } });

  await prisma.person.createMany({
    data: [
      {
        familyId: family.id,
        displayName: "Nguyễn Văn An",
        gender: "male",
        birthDate: new Date("1948-03-02"),
        deathDate: null,
      },
      {
        familyId: family.id,
        displayName: "Trần Thị Bình",
        gender: "female",
        birthDate: new Date("1952-07-19"),
        deathDate: null,
      },
    ],
  });

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

  console.log(
    `seeded family "${family.slug}" with ${await prisma.person.count()} people`,
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
