import * as membershipModel from "../models/membership.model.js";
import type {
  Family,
  FamilyMember,
  Role,
  MemberCandidate,
} from "../models/membership.model.js";
import { transact } from "../models/db.js";

export type RoleChange =
  | { ok: true }
  | { ok: false; reason: "not-found" }
  | { ok: false; reason: "last-owner"; candidates: MemberCandidate[] };

export type Leave =
  | { ok: true }
  | { ok: false; reason: "last-owner"; candidates: MemberCandidate[] };

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
/**
 * A test seam at the race window: the gap between reading the owner count and
 * writing the decision. checkOwnership parks here to force the losing
 * interleaving. Callers that pass nothing are unaffected.
 */
export interface RaceWindow {
  afterCount?: () => Promise<void>;
}

export async function changeRole(
  input: {
    familyId: string;
    membershipId: string;
    nextRole: Role;
  },
  window: RaceWindow = {},
): Promise<RoleChange> {
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
      if (owners <= 1) {
        const candidates = await membershipModel.findOtherMembers(
          input.familyId,
          target.id,
          tx,
        );
        return { ok: false, reason: "last-owner", candidates };
      }
      await window.afterCount?.();
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
      if (owners <= 1) {
        const candidates = await membershipModel.findOtherMembers(
          input.familyId,
          membership.id,
          tx,
        );
        return { ok: false, reason: "last-owner", candidates };
      }
    }

    await membershipModel.deleteById(input.membershipId, tx);
    return { ok: true };
  });
}

export type Transfer =
  | { ok: true }
  | { ok: false; reason: "not-found" | "self" | "not-owner" };

export type KeepRole = Extract<Role, "member" | "admin">;

/**
 * Move ownership to another member as one transition.
 *
 * One transaction because the intent is one fact: "Minh owns this family now."
 * Promote the target, demote the caller -- both writes commit or neither does.
 * No count is needed here: the unit either commits with at least one owner or
 * it never happened. (Transfer to *self* would be promote-then-demote of the
 * same row, so it is rejected below.)
 */
export async function transferOwnership(input: {
  familyId: string;
  callerMembershipId: string;
  toMembershipId: string;
  keepRole: KeepRole;
}): Promise<Transfer> {
  return transact(async (tx) => {
    await membershipModel.lockFamily(input.familyId, tx);

    // Re-read the caller INSIDE the lock. The route guard saw their role when
    // the request arrived; another owner may have demoted it since. Trusting
    // the stale copy would let a demoted owner promote anyone.
    const caller = await membershipModel.findByFamily(
      input.familyId,
      input.callerMembershipId,
      tx,
    );
    if (caller === null || caller.role !== "owner") {
      return { ok: false, reason: "not-owner" };
    }

    const target = await membershipModel.findByFamily(
      input.familyId,
      input.toMembershipId,
      tx,
    );
    if (target === null) return { ok: false, reason: "not-found" };
    if (target.id === caller.id) return { ok: false, reason: "self" };

    await membershipModel.updateRole(target.id, "owner", tx);
    await membershipModel.updateRole(caller.id, input.keepRole, tx);
    return { ok: true };
  });
}

/**
 * The families this caller belongs to.
 *
 * A pass-through today -- the query is already scoped to the caller -- so the
 * value is in the naming, not the logic: the controller never touches a model,
 * and "which families are mine" has exactly one definition.
 */
export async function listMyFamilies(
  userId: string,
): Promise<(FamilyMember & { family: Family })[]> {
  return membershipModel.findAllForUser(userId);
}
