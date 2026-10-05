import type { NextFunction, Request, Response } from "express";
import type { ApiErrorBody } from "../contracts.js";
import { ROLES, type Role } from "../models/membership.model.js";
import { familyContext } from "../middlewares/family.js";
import { changeRole, leaveFamily } from "../services/membership.service.js";

function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

export async function patchMemberRole(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { family } = familyContext(req);
    const { membershipId } = req.params;
    // Express 5: req.body is undefined when nothing parsed it, so read defensively.
    const nextRole = (req.body as { role?: unknown } | undefined)?.role;

    if (typeof membershipId !== "string" || !isRole(nextRole)) {
      const body: ApiErrorBody = {
        message: "role must be owner, admin or member",
      };
      res.status(400).json(body);
      return;
    }

    const result = await changeRole({
      familyId: family.id,
      membershipId,
      nextRole,
    });

    if (!result.ok) {
      // "no such member in this family" -> 404; "that would orphan the family" -> 409.
      const body: ApiErrorBody =
        result.reason === "not-found"
          ? { message: "Member not found" }
          : { message: "A family must keep at least one owner" };
      res.status(result.reason === "not-found" ? 404 : 409).json(body);
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

export async function leave(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { family, membership } = familyContext(req);

    const result = await leaveFamily({
      familyId: family.id,
      membershipId: membership.id,
    });

    if (!result.ok) {
      const body: ApiErrorBody = {
        message: "A family must keep at least one owner",
      };
      res.status(409).json(body);
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
