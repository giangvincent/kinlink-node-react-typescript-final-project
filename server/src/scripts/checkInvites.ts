import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import { listPendingInvitations } from "../services/invitation.service.js";
import { toInvitationResource } from "../views/invitation.view.js";

// Four invitations, four states. The list must show exactly the claimable two:
// a used invite is not pending, an expired invite is not pending, and the
// shareable row (email: null) must survive the wire as null, not as "".
async function main(): Promise<void> {
  const slug = `probe-${randomUUID().slice(0, 8)}`;
  const family = await prisma.family.create({
    data: { slug, name: "Pending probe" },
  });

  try {
    const future = new Date(Date.now() + 86_400_000);
    const past = new Date(Date.now() - 86_400_000);

    const seed = async (input: {
      email: string | null;
      usedAt: Date | null;
      expiresAt: Date;
      createdAt: Date;
    }): Promise<void> => {
      await prisma.invitation.create({
        data: {
          familyId: family.id,
          role: "member",
          email: input.email,
          tokenHash: `${slug}-${randomUUID()}`,
          createdAt: input.createdAt,
          expiresAt: input.expiresAt,
          usedAt: input.usedAt,
          createdBy: "probe",
        },
      });
    };

    const t = Date.now();
    await seed({
      email: "old@probe.invalid",
      usedAt: null,
      expiresAt: future,
      createdAt: new Date(t - 2000),
    });
    await seed({
      email: null,
      usedAt: null,
      expiresAt: future,
      createdAt: new Date(t - 1000),
    });
    await seed({
      email: "used@probe.invalid",
      usedAt: past,
      expiresAt: future,
      createdAt: new Date(t),
    });
    await seed({
      email: "stale@probe.invalid",
      usedAt: null,
      expiresAt: past,
      createdAt: new Date(t),
    });

    const rows = await listPendingInvitations(family.id);
    const resources = rows.map(toInvitationResource);
    const emails = resources.map((r) => r.email);

    console.log(`rows returned:  ${resources.length}`);
    console.log(`emails:         ${JSON.stringify(emails)}`);
    console.log(`newest first:   ${emails[0] === null}`);

    if (resources.length !== 2) {
      throw new Error(`EXPECTED 2 pending, got ${resources.length}`);
    }
    if (!emails.includes(null)) {
      throw new Error("SHAREABLE HIDDEN: the email:null row is missing");
    }
    if (
      emails.includes("used@probe.invalid") ||
      emails.includes("stale@probe.invalid")
    ) {
      throw new Error("NOT PENDING: a used or expired invite was listed");
    }
    if (emails[0] !== null) {
      throw new Error("ORDER WRONG: expected the newest first");
    }
    const sample = resources[0];
    if (
      typeof sample?.createdAt !== "string" ||
      typeof sample?.expiresAt !== "string"
    ) {
      throw new Error("VIEW WRONG: dates must cross the wire as ISO strings");
    }

    console.log("\npending filter, ordering and view mapping all held");
  } finally {
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
