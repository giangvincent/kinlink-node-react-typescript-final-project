import type { NextFunction, Request, Response } from "express";
import type { ApiErrorBody } from "../contracts.js";
import { ROLES, type Role } from "../models/membership.model.js";
import { familyContext } from "../middlewares/family.js";
import { changeRole, leaveFamily } from "../services/membership.service.js";
import { lastOwnerProblem, problem } from "../views/problem.view.js";
import {
  transferOwnership,
  type KeepRole,
} from "../services/membership.service.js";

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
      if (result.reason === "not-found") {
        res.status(404).json({ message: "Member not found" });
        return;
      }
      res
        .status(409)
        .type("application/problem+json")
        .json(lastOwnerProblem(family.slug, result.candidates));
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

export async function transferOwner(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { family, membership } = familyContext(req);
    // Express 5: req.body is undefined when nothing parsed it.
    const body = (req.body ?? {}) as { to?: unknown; keepRole?: unknown };
    const to = body.to;
    const keepRole = body.keepRole ?? "member";

    if (
      typeof to !== "string" ||
      (keepRole !== "member" && keepRole !== "admin")
    ) {
      res.status(400).json({
        message: "to must be a membership id; keepRole must be member or admin",
      });
      return;
    }

    const result = await transferOwnership({
      familyId: family.id,
      callerMembershipId: membership.id,
      toMembershipId: to,
      keepRole,
    });

    if (!result.ok) {
      if (result.reason === "self") {
        res.status(400).json({ message: "You already own this family" });
        return;
      }
      if (result.reason === "not-found") {
        res.status(404).json({ message: "Member not found" });
        return;
      }
      // "not-owner": demoted mid-request. A state conflict, not a verdict on
      // the caller -- so 409, and the client reloads and retries.
      res
        .status(409)
        .type("application/problem+json")
        .json(
          problem({
            code: "not_owner",
            status: 409,
            detail:
              "Your role changed while this request was in flight. Reload and try again.",
          }),
        );
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
