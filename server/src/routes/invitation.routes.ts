import { Router } from "express";
import { requireAuth, authContext } from "../middlewares/auth.js";
import { familyContext } from "../middlewares/family.js";
import { requireRole } from "../middlewares/role.js";
import {
  createInvitation,
  acceptInvitation,
} from "../services/invitation.service.js";

export const invitationRouter = Router({ mergeParams: true });

// Owner-only. The granted role must be ≤ the inviter's rank.
invitationRouter.post("/", requireRole("owner"), async (req, res, next) => {
  const { family, membership } = familyContext(req);
  const { email, role } = req.body as { email?: string; role?: string };
  // ... validation, then createInvitation({ familyId: family.id, ... })
});

// Authenticated. The session's user claims the token — userId never from body.
invitationRouter.post("/:token/accept", requireAuth, async (req, res, next) => {
  const { userId } = authContext(req);
  const { token } = req.params as { token: string };
  // ... acceptInvitation(token, userId)
});
