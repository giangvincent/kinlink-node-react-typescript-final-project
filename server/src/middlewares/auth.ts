import type { Request, RequestHandler } from "express";
import type { ApiErrorBody } from "../contracts.js";

/** Reject unauthenticated requests. 401, not 500: nothing failed on the server. */
export const requireAuth: RequestHandler = (req, res, next) => {
  const { userId } = req.session;

  if (!userId) {
    const body: ApiErrorBody = { message: "Authentication required" };
    res.status(401).json(body);
    return;
  }

  req.authenticatedUserId = userId;
  next();
};

/** Identity, refusing to guess. Throws only if the chain is wired wrong. */
export function authContext(req: Request): { userId: string } {
  const { authenticatedUserId } = req;

  if (!authenticatedUserId) {
    throw new Error("Route is missing requireAuth");
  }

  return { userId: authenticatedUserId };
}
