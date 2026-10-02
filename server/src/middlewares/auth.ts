import type { Request, RequestHandler } from "express";
import type { ApiErrorBody } from "../contracts.js";

/**
 * Reject unauthenticated requests. 401, not 500: nothing failed on the server,
 * the caller simply did not present credentials.
 */
export const requireAuth: RequestHandler = (req, res, next) => {
  const { userId, familyId } = req.session;

  if (!userId || !familyId) {
    const body: ApiErrorBody = { message: "Authentication required" };
    res.status(401).json(body);
    return;
  }

  req.authenticatedUserId = userId;
  req.authenticatedFamilyId = familyId;
  next();
};

/**
 * Read the auth context, refusing to guess.
 *
 * Anything mounted below requireAuth will have set these. If they are missing we
 * have a wiring bug -- a route reached a controller without the guard -- and a
 * wiring bug must fail loudly rather than quietly reading the wrong rows.
 */
export function authContext(req: Request): {
  userId: string;
  familyId: string;
} {
  const { authenticatedUserId, authenticatedFamilyId } = req;

  if (!authenticatedUserId || !authenticatedFamilyId) {
    throw new Error("Route is missing requireAuth");
  }

  return {
    userId: authenticatedUserId,
    familyId: authenticatedFamilyId,
  };
}
