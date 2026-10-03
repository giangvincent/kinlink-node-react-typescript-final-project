import type { Request, RequestHandler } from "express";
import type { ApiErrorBody } from "../contracts.js";
import type { Family, FamilyMember } from "../models/membership.model.js";
import { findFamilyAccess } from "../services/membership.service.js";
import { authContext } from "./auth.js";

/**
 * Resolve :slug to a family this caller belongs to, or answer 404.
 *
 * Both "no such family" and "not a member of it" answer 404 with the same body,
 * because a 403 would confirm the family exists and turn this endpoint into a
 * directory of every family in KinLink.
 *
 * Async middleware: Express 5 forwards a rejection to the error handler, so a
 * database failure becomes a 500 without a try/catch here.
 */
export const loadFamily: RequestHandler = async (req, res, next) => {
  const { userId } = authContext(req);
  const { slug } = req.params;

  if (typeof slug !== "string" || slug.length === 0) {
    const body: ApiErrorBody = { message: "Family not found" };
    res.status(404).json(body);
    return;
  }

  const access = await findFamilyAccess(userId, slug);
  if (access === null) {
    const body: ApiErrorBody = { message: "Family not found" };
    res.status(404).json(body);
    return;
  }

  req.family = access.family;
  req.membership = access.membership;
  next();
};

/**
 * The authorisation context, read from the request rather than re-derived.
 * Throws only when the chain is wired wrong -- an assertion, not a response.
 */
export function familyContext(req: Request): {
  userId: string;
  family: Family;
  membership: FamilyMember;
} {
  const { authenticatedUserId, family, membership } = req;

  if (!authenticatedUserId || !family || !membership) {
    throw new Error("Route is missing requireAuth/loadFamily");
  }

  return {
    userId: authenticatedUserId,
    family,
    membership,
  };
}
