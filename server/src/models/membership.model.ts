import { prisma } from "../config/database.js";
import type {
  Family,
  FamilyMember,
  FamilyRole,
} from "../../generated/prisma/client.js";
import type { Db } from "./db.js";

// Runtime list of the enum, so validation never hand-writes the three names twice.
export const ROLES = [
  "member",
  "admin",
  "owner",
] as const satisfies readonly Role[];

// The model layer re-exports the ORM's types so nothing above it imports Prisma.
export type { Family, FamilyMember };
export type Role = FamilyRole;

/**
 * The single query that answers "may this user act on this family?".
 *
 * The membership is part of the WHERE clause, so there is no version of this
 * function that returns a family the caller has no relationship with. The
 * tempting alternative -- findFamilyBySlug() then findMembership() -- is two
 * facts, and then the security property rests on somebody remembering to compare
 * them. Make the unsafe version unrepresentable instead.
 */
export async function findMembershipWithFamily(
  userId: string,
  slug: string,
): Promise<(FamilyMember & { family: Family }) | null> {
  return prisma.familyMember.findFirst({
    where: { userId, family: { slug } },
    include: { family: true },
  });
}

/**
 * Find a membership *within a family*. The familyId is in the WHERE clause, so a
 * membership id taken from a URL can never select a row belonging to another family
 * on its own -- the same shape as the lesson-06 guard, one level down.
 */
export async function findByFamily(
  familyId: string,
  membershipId: string,
  database: Db = prisma,
): Promise<FamilyMember | null> {
  return database.familyMember.findFirst({
    where: { id: membershipId, familyId },
  });
}

export async function countOwners(
  familyId: string,
  database: Db = prisma,
): Promise<number> {
  return database.familyMember.count({ where: { familyId, role: "owner" } });
}

/**
 * Serialise ownership changes for one family.
 *
 * MySQL's manual is explicit about this shape of problem: "If you query data and
 * then insert or update related data within the same transaction, the regular
 * SELECT statement does not give enough protection." Counting owners and then
 * writing is a lost update waiting to happen -- two transactions both read
 * "2 owners" and both write. FOR UPDATE takes an exclusive row lock, so the second
 * waits, then re-counts a world where only one owner is left, and refuses.
 *
 * Locking reads require autocommit to be off, which an interactive transaction
 * already provides.
 */
export async function lockFamily(
  familyId: string,
  database: Db = prisma,
): Promise<void> {
  await database.$queryRaw`SELECT id FROM families WHERE id = ${familyId} FOR UPDATE`;
}

export async function updateRole(
  membershipId: string,
  role: Role,
  database: Db = prisma,
): Promise<void> {
  await database.familyMember.update({
    where: { id: membershipId },
    data: { role },
  });
}

export async function deleteById(
  membershipId: string,
  database: Db = prisma,
): Promise<void> {
  await database.familyMember.delete({ where: { id: membershipId } });
}
