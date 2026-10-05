import * as membershipModel from "../models/membership.model.js";
import type { Family, FamilyMember, Role } from "../models/membership.model.js";
import { transact } from "../models/db.js";

export type RoleChange =
  | { ok: true }
  | { ok: false; reason: "not-found" | "last-owner" };

export type Leave = { ok: true } | { ok: false; reason: "last-owner" };

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

/**
 * Change a member's role.
 *
 * "A family must keep at least one owner" is policy about a transition, so it lives
 * in the service -- not the middleware (HTTP), not the model (facts), and not a
 * database constraint (MySQL cannot express "at least one row like this"). It is
 * checked and written inside one transaction, behind a family-level lock.
 */
export async function changeRole(input: {
  familyId: string;
  membershipId: string;
  nextRole: Role;
}): Promise<RoleChange> {
  return transact(async (tx) => {
    await membershipModel.lockFamily(input.familyId, tx);

    const target = await membershipModel.findByFamily(
      input.familyId,
      input.membershipId,
      tx,
    );
    if (target === null) return { ok: false, reason: "not-found" };

    if (target.role === "owner" && input.nextRole !== "owner") {
      const owners = await membershipModel.countOwners(input.familyId, tx);
      if (owners <= 1) return { ok: false, reason: "last-owner" };
    }

    await membershipModel.updateRole(input.membershipId, input.nextRole, tx);
    return { ok: true };
  });
}

/**
 * A member leaves. The last owner may not -- the family would lose its only key.
 *
 * Idempotent on purpose: if the membership is already gone, the caller's intent
 * ("I am not in this family") is satisfied, so this is a success, not a 404.
 */
export async function leaveFamily(input: {
  familyId: string;
  membershipId: string;
}): Promise<Leave> {
  return transact(async (tx) => {
    await membershipModel.lockFamily(input.familyId, tx);

    const membership = await membershipModel.findByFamily(
      input.familyId,
      input.membershipId,
      tx,
    );
    if (membership === null) return { ok: true };

    if (membership.role === "owner") {
      const owners = await membershipModel.countOwners(input.familyId, tx);
      if (owners <= 1) return { ok: false, reason: "last-owner" };
    }

    await membershipModel.deleteById(input.membershipId, tx);
    return { ok: true };
  });
}
