import { prisma } from "../config/database.js";
import type { Invitation } from "../../generated/prisma/client.js";
import type { Db } from "./db.js";
import type { Role } from "./membership.model.js";

// The model layer re-exports the ORM's types so nothing above it imports Prisma.
export type { Invitation };

/**
 * Pending = not claimed and not expired.
 *
 * The same pair of conditions the accept path checks, in the same transaction
 * that consumes a token. If the two ever drift, the list starts offering
 * invitations the accept endpoint will refuse.
 */
export async function findPendingByFamily(
  familyId: string,
  database: Db = prisma,
): Promise<Invitation[]> {
  return database.invitation.findMany({
    where: { familyId, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function findPendingByEmail(
  familyId: string,
  email: string,
  database: Db = prisma,
): Promise<Invitation | null> {
  return database.invitation.findFirst({
    where: { familyId, email, usedAt: null, expiresAt: { gt: new Date() } },
  });
}

export async function createInvitation(
  input: {
    familyId: string;
    role: Role;
    email: string | null;
    tokenHash: string;
    expiresAt: Date;
    createdBy: string;
  },
  database: Db = prisma,
): Promise<void> {
  await database.invitation.create({ data: input });
}
