import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import {
  createInvitation,
  resendInvitation,
  acceptInvitation,
} from "../services/invitation.service.js";

async function main(): Promise<void> {
  const slug = `resend-${randomUUID().slice(0, 8)}`;
  const family = await prisma.family.create({
    data: { slug, name: "Resend probe" },
  });
  const ownerEmail = `${slug}-owner@probe.invalid`;
  const inviteeEmail = `${slug}-invitee@probe.invalid`;
  const owner = await prisma.user.create({
    data: { email: ownerEmail, passwordHash: "probe" },
  });
  const invitee = await prisma.user.create({
    data: { email: inviteeEmail, passwordHash: "probe" },
  });

  try {
    const membership = await prisma.familyMember.create({
      data: { userId: owner.id, familyId: family.id, role: "owner" },
    });

    const first = await createInvitation({
      familyId: family.id,
      inviterMembershipId: membership.id,
      role: "member",
      email: "target@probe.invalid",
    });
    if (!first.ok) throw new Error("SETUP: first mint failed");

    const pendingBefore = await prisma.invitation.findFirst({
      where: { familyId: family.id, revokedAt: null, usedAt: null },
    });
    if (!pendingBefore) throw new Error("SETUP: no pending row to resend");

    const resent = await resendInvitation({
      familyId: family.id,
      inviterMembershipId: membership.id,
      invitationId: pendingBefore.id,
    });
    if (!resent.ok) throw new Error(`RESEND REFUSED: ${resent.reason}`);

    const oldRow = await prisma.invitation.findUnique({
      where: { id: pendingBefore.id },
    });
    const pending = await prisma.invitation.count({
      where: {
        familyId: family.id,
        usedAt: null,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    const oldAccept = await acceptInvitation(first.token, invitee.id);
    const newAccept = await acceptInvitation(resent.token, invitee.id);

    console.log(`old token revoked: ${oldRow?.revokedAt !== null}`);
    console.log(`pending row count: ${pending}`);
    console.log(`old token accepted: ${oldAccept.ok}`);
    console.log(`new token accepted: ${newAccept.ok}`);

    if (oldRow?.revokedAt === null) {
      throw new Error(
        "OLD CREDENTIAL ALIVE: resend did not revoke the original",
      );
    }
    if (pending !== 1) {
      throw new Error(`EXPECTED exactly 1 pending row, got ${pending}`);
    }
    if (oldAccept.ok) {
      throw new Error("OLD TOKEN STILL WORKS after resend");
    }
    if (!newAccept.ok) {
      throw new Error("NEW TOKEN REJECTED after resend");
    }

    console.log("\nresend revoked the old credential and issued a live one");
  } finally {
    await prisma.family.delete({ where: { id: family.id } });
    await prisma.user.deleteMany({
      where: { email: { in: [ownerEmail, inviteeEmail] } },
    });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
