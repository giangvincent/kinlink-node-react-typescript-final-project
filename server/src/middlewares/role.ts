import type { RequestHandler } from "express";
import type { ApiErrorBody } from "../contracts.js";
import type { Role } from "../models/membership.model.js";
import { familyContext } from "./family.js";

// A rank, not a list of acceptable strings. "admin" means admin or above, so
// adding a role later cannot silently narrow or widen an existing check. Typed as
// a total map, so a new role is a compile error until it is ranked.
const RANK = { member: 1, admin: 2, owner: 3 } as const satisfies Record<Role, number>;

/**
 * 403, not 404. The caller is inside the family -- loadFamily proved it -- so its
 * existence is not a secret from them. "You may not do this" is the honest answer,
 * and it is actionable in a way that another 404 would not be.
 */
export const requireRole = (minimum: Role): RequestHandler => (req, res, next) => {
  const { membership } = familyContext(req);

  if (RANK[membership.role] < RANK[minimum]) {
    const body: ApiErrorBody = { message: "Insufficient role" };
    res.status(403).json(body);
    return;
  }

  next();
};
