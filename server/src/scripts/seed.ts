import "dotenv/config";
import { prisma } from "../config/database.js";

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
