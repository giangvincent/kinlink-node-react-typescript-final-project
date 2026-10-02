import type { RequestHandler, Request, Response, NextFunction } from "express";

interface SessionWithUser extends Express.MutatedSession {
  userId?: string;
  familyId?: string;
}

/** Attach user info from the session, reject if absent. */
export const requireAuth: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  const session = req.session as unknown as SessionWithUser;
  if (!session.userId || !session.familyId) {
    req.next(new Error("Authentication required"));
    return;
  }

  req.authenticatedUserId = session.userId;
  req.authenticatedFamilyId = session.familyId;
  next();
};
