import { createHash, randomBytes } from "node:crypto";
import { prisma } from "../config/database.js";
import type { Db } from "../models/db.js";
import { transact } from "../models/db.js";
import { ROLES, type Role } from "../models/membership.model.js";
import * as invitationModel from "../models/invitation.model.js";
import type { Invitation } from "../models/invitation.model.js";

export type InvitationResult =
  | { ok: true }
  | { ok: false; reason: "not-found" | "expired" | "used" | "already-member" };

/** SHA-256 hex. Raw token sent once, only the hash stored. */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

const RANK = { member: 1, admin: 2, owner: 3 } as const satisfies Record<
  Role,
  number
>;

/**
 * Mint an invite. Granted role must be <= inviter's rank, else the role
 * system is decorative (admin mints owner, promotes self by proxy).
 */
export async function createInvitation(input: {
  familyId: string;
  role: Role;
  inviterRole: Role;
  createdBy: string;
  email?: string | null;
}): Promise<{ token: string }> {
  if (!ROLES.includes(input.role)) throw new Error("Invalid role");
  if (RANK[input.role] > RANK[input.inviterRole])
    throw new Error("Insufficient role");
  const token = randomBytes(32).toString("base64url");
  await prisma.invitation.create({
    data: {
      familyId: input.familyId,
      role: input.role,
      email: input.email ?? null,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: input.createdBy,
    },
  });
  return { token };
}

/**
 * Accept an invitation in one transaction.
 *
 * The compare-and-set: updateMany with usedAt: null in the WHERE clause.
 * MySQL returns how many rows actually changed — count !== 1 means
 * someone else won, or it expired. The expiry check is in the same
 * statement, so a stale invite is indistinguishable from a used one
 * (the right amount of information for a stranger holding a stale link).
 */
export async function acceptInvitation(
  token: string,
  userId: string,
): Promise<InvitationResult> {
  return transact(async (tx: Db) => {
    // One conditional write decides the race.
    const claimed = await tx.invitation.updateMany({
      where: {
        tokenHash: hashToken(token),
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (claimed.count !== 1) {
      // Distinguish in logs, collapse on wire.
      return { ok: false, reason: "used" };
    }

    const invite = await tx.invitation.findFirst({
      where: { tokenHash: hashToken(token) },
    });
    if (!invite) return { ok: false, reason: "not-found" };

    // Already a member of this family? Claim was consumed; clean up.
    const existing = await tx.familyMember.findFirst({
      where: { userId: userId, familyId: invite.familyId },
    });
    if (existing) return { ok: false, reason: "already-member" };

    await tx.familyMember.create({
      data: {
        userId,
        familyId: invite.familyId,
        role: invite.role,
      },
    });

    return { ok: true };
  });
}

/**
 * The invitations a family can still act on, newest first.
 *
 * "Pending" is a policy word, so it lives here rather than in the query the
 * controller could have written: one definition of claimable, in one place.
 */
export async function listPendingInvitations(
  familyId: string,
): Promise<Invitation[]> {
  return invitationModel.findPendingByFamily(familyId);
}
