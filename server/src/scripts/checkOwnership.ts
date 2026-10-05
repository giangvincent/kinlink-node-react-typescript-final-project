import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import { changeRole } from "../services/membership.service.js";

// Two owners demote themselves simultaneously. Exactly one must be refused, and
// exactly one owner must remain -- the invariant that no route can repair if broken.
async function main(): Promise<void> {
  const slug = `probe-${randomUUID().slice(0, 8)}`;
  const family = await prisma.family.create({
    data: { slug, name: "Ownership probe" },
  });

  try {
    const owners = await Promise.all(
      [1, 2].map(async (n) => {
        const user = await prisma.user.create({
          data: { email: `${slug}-${n}@probe.invalid`, passwordHash: "x" },
        });
        const membership = await prisma.familyMember.create({
          data: { userId: user.id, familyId: family.id, role: "owner" },
        });
        return membership.id;
      }),
    );

    const results = await Promise.all(
      owners.map((membershipId) =>
        changeRole({ familyId: family.id, membershipId, nextRole: "member" }),
      ),
    );

    const refused = results.filter((r) => !r.ok).length;
    const remaining = await prisma.familyMember.count({
      where: { familyId: family.id, role: "owner" },
    });

    console.log(`demotions refused: ${refused}`);
    console.log(`owners remaining:  ${remaining}`);

    if (remaining !== 1) {
      throw new Error(
        `INVARIANT BROKEN: ${remaining} owner(s) remain, expected 1`,
      );
    }
    console.log("\nownership invariant held under concurrent demotion");
  } finally {
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.user.deleteMany({ where: { email: { startsWith: slug } } });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
