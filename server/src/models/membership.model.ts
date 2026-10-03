import { prisma } from "../config/database.js";
import type {
  Family,
  FamilyMember,
  FamilyRole,
} from "../../generated/prisma/client.js";

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
