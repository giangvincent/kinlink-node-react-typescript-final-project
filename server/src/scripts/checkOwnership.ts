import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import { changeRole } from "../services/membership.service.js";

// A gate: one promise that reports arrival at the race window, one that
// releases it. The test -- not the scheduler -- decides the interleaving.
function gate(): {
  afterCount: () => Promise<void>;
  arrived: Promise<void>;
  open: () => void;
} {
  let arrive!: () => void;
  let open!: () => void;
  const arrived = new Promise<void>((resolve) => (arrive = resolve));
  const opened = new Promise<void>((resolve) => (open = resolve));
  return {
    afterCount: async () => {
      arrive();
      await opened;
    },
    arrived,
    open: () => open(),
  };
}

// Two owners demote themselves in an interleaving the test chooses. t1 counts
// and parks inside the race window; t2 must be blocked before it can count.
// Both of those are asserted -- remove the lock and this fails every run.
async function main(): Promise<void> {
  const slug = `probe-${randomUUID().slice(0, 8)}`;
  const family = await prisma.family.create({
    data: { slug, name: "Ownership probe" },
  });

  try {
    const makeOwner = async (n: number): Promise<string> => {
      const user = await prisma.user.create({
        data: { email: `${slug}-${n}@probe.invalid`, passwordHash: "x" },
      });
      const membership = await prisma.familyMember.create({
        data: { userId: user.id, familyId: family.id, role: "owner" },
      });
      return membership.id;
    };
    const [ownerA, ownerB] = await Promise.all([makeOwner(1), makeOwner(2)]);

    const g1 = gate();
    const g2 = gate();

    const t1 = changeRole(
      { familyId: family.id, membershipId: ownerA, nextRole: "member" },
      { afterCount: g1.afterCount },
    );
    await g1.arrived; // t1 has counted and parked; it holds the family lock

    const t2 = changeRole(
      { familyId: family.id, membershipId: ownerB, nextRole: "member" },
      { afterCount: g2.afterCount },
    );
    // Did t2 reach the race window while t1 sat in it? With the lock it is
    // blocked at lockFamily and cannot. The 400ms is only how long we listen:
    // the invariant assertion below is what makes this check unable to pass
    // against broken code, whatever the machine.
    const t2InWindow = await Promise.race([
      g2.arrived.then(() => true),
      new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 400)),
    ]);

    g1.open();
    g2.open();
    const results = await Promise.all([t1, t2]);

    const refused = results.filter((r) => !r.ok).length;
    const remaining = await prisma.familyMember.count({
      where: { familyId: family.id, role: "owner" },
    });

    console.log(
      `t2 entered the race window while t1 held the lock: ${t2InWindow ? "yes" : "no"}`,
    );
    console.log(`demotions refused: ${refused}`);
    console.log(`owners remaining:  ${remaining}`);

    if (t2InWindow) {
      throw new Error("RACE NOT SERIALIZED: t2 counted while t1 held the lock");
    }
    if (remaining !== 1) {
      throw new Error(
        `INVARIANT BROKEN: ${remaining} owner(s) remain, expected 1`,
      );
    }
    console.log("\nownership invariant held under forced interleaving");
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
