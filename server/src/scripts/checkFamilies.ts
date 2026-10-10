import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import { listMyFamilies } from "../services/membership.service.js";
import { toFamilyResource } from "../views/family.view.js";

// Two users, three families. The caller must see their own two and neither of
// the stranger's: the userId is in the WHERE clause, the same property the
// family-scoped routes have, over many rows instead of one.
async function main(): Promise<void> {
  const suffix = randomUUID().slice(0, 8);
  const shared = await prisma.family.create({
    data: { slug: `probe-shared-${suffix}`, name: "Shared probe" },
  });
  const other = await prisma.family.create({
    data: { slug: `probe-other-${suffix}`, name: "Other probe" },
  });
  const strangerFamily = await prisma.family.create({
    data: { slug: `probe-stranger-${suffix}`, name: "Stranger probe" },
  });

  try {
    const me = await prisma.user.create({
      data: { email: `me-${suffix}@probe.invalid`, passwordHash: "probe" },
    });
    const stranger = await prisma.user.create({
      data: {
        email: `stranger-${suffix}@probe.invalid`,
        passwordHash: "probe",
      },
    });

    const t = Date.now();
    await prisma.familyMember.create({
      data: {
        userId: me.id,
        familyId: shared.id,
        role: "owner",
        createdAt: new Date(t - 2000),
      },
    });
    await prisma.familyMember.create({
      data: {
        userId: me.id,
        familyId: other.id,
        role: "member",
        createdAt: new Date(t - 1000),
      },
    });
    await prisma.familyMember.create({
      data: { userId: stranger.id, familyId: strangerFamily.id, role: "owner" },
    });

    const rows = await listMyFamilies(me.id);
    const resources = rows.map(toFamilyResource);
    const slugs = resources.map((r) => r.slug);
    const roles = resources.map((r) => r.role);

    console.log(`families returned: ${resources.length}`);
    console.log(`roles:             ${JSON.stringify(roles)}`);

    if (resources.length !== 2) {
      throw new Error(`EXPECTED 2 families, got ${resources.length}`);
    }
    if (slugs.includes(strangerFamily.slug)) {
      throw new Error("LEAK: another user's family was returned");
    }
    if (!slugs.includes(shared.slug) || !slugs.includes(other.slug)) {
      throw new Error("MISSING: one of the caller's families was not returned");
    }
    if (roles[0] !== "owner" || roles[1] !== "member") {
      throw new Error(
        `ORDER/ROLE WRONG: expected [owner, member], got ${JSON.stringify(roles)}`,
      );
    }
    if (resources.some((row) => "id" in row)) {
      throw new Error("LEAK: the family id crossed the view");
    }

    console.log("\nmy-families scoping, ordering and view mapping all held");
  } finally {
    await prisma.family.deleteMany({
      where: { id: { in: [shared.id, other.id, strangerFamily.id] } },
    });
    await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
