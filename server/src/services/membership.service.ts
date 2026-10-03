import * as membershipModel from "../models/membership.model.js";
import type { Family, FamilyMember } from "../models/membership.model.js";

export interface FamilyAccess {
  family: Family;
  membership: FamilyMember;
}

/**
 * Policy: which family is this caller allowed to act on?
 *
 * Returns null for BOTH "no such family" and "not a member of it". That collapse
 * happens HERE, on purpose, so the middleware that turns null into a response has
 * no difference left to leak. One return value, one status code, no oracle.
 */
export async function findFamilyAccess(
  userId: string,
  slug: string,
): Promise<FamilyAccess | null> {
  const row = await membershipModel.findMembershipWithFamily(userId, slug);
  if (row === null) return null;

  return { family: row.family, membership: row };
}
