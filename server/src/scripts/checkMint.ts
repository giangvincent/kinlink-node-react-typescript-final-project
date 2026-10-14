import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import { createInvitation } from "../services/invitation.service.js";

function gate(): {
  afterDuplicateCheck: () => Promise<void>;
  arrived: Promise<void>;
  open: () => void;
} {
  let arrive!: () => void;
  let open!: () => void;
  const arrived = new Promise<void>((resolve) => (arrive = resolve));
  const opened = new Promise<void>((resolve) => (open = resolve));
  return {
    afterDuplicateCheck: async () => {
      arrive();
      await opened;
    },
    arrived,
    open: () => open(),
  };
}

async function main(): Promise<void> {
  const slug = `mint-${randomUUID().slice(0, 8)}`;
  const email = `${slug}@probe.invalid`;
  const family = await prisma.family.create({
    data: { slug, name: "Mint probe" },
  });
  const user = await prisma.user.create({
    data: { email, passwordHash: "probe" },
  });

  try {
    const membership = await prisma.familyMember.create({
      data: { userId: user.id, familyId: family.id, role: "owner" },
    });
    const firstGate = gate();
    const secondGate = gate();
    const input = {
      familyId: family.id,
      inviterMembershipId: membership.id,
      role: "member" as const,
      email: "same@probe.invalid",
    };

    const first = createInvitation(input, {
      afterDuplicateCheck: firstGate.afterDuplicateCheck,
    });
    await firstGate.arrived;

    const second = createInvitation(input, {
      afterDuplicateCheck: secondGate.afterDuplicateCheck,
    });
    let timer: ReturnType<typeof setTimeout>;
    const secondReachedCheck = await Promise.race([
      secondGate.arrived.then(() => true),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), 400);
      }),
    ]);
    clearTimeout(timer!);

    firstGate.open();
    secondGate.open();
    const results = await Promise.all([first, second]);
    const pending = await prisma.invitation.count({
      where: {
        familyId: family.id,
        email: input.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
    });
    const successes = results.filter((result) => result.ok).length;
    const duplicates = results.filter(
      (result) => !result.ok && result.reason === "duplicate-email",
    ).length;

    console.log(`second reached check while locked: ${secondReachedCheck}`);
    console.log(`successful mints: ${successes}`);
    console.log(`duplicate refusals: ${duplicates}`);
    console.log(`pending matching rows: ${pending}`);

    if (secondReachedCheck) {
      throw new Error(
        "RACE NOT SERIALIZED: second mint passed the family lock",
      );
    }
    if (successes !== 1 || duplicates !== 1 || pending !== 1) {
      throw new Error(
        `INVARIANT BROKEN: successes=${successes}, duplicates=${duplicates}, rows=${pending}`,
      );
    }

    await prisma.familyMember.update({
      where: { id: membership.id },
      data: { role: "member" },
    });
    const demoted = await createInvitation({
      ...input,
      email: "after-demotion@probe.invalid",
    });
    if (demoted.ok || demoted.reason !== "not-owner") {
      throw new Error("STALE AUTHORITY: demoted inviter minted an invitation");
    }

    console.log("\nmint invariant held; demoted inviter refused");
  } finally {
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
