import { Router } from "express";
import { requireAuth, authContext } from "../middlewares/auth.js";
import { familyContext } from "../middlewares/family.js";
import { requireRole } from "../middlewares/role.js";
import {
  createInvitation,
  acceptInvitation,
} from "../services/invitation.service.js";
import { getFamilyInvitations } from "../controllers/invitation.controller.js";

// Create rides loadFamily: slug names the family, owner role gates the mint.
export const invitationRouter = Router({ mergeParams: true });

invitationRouter.post("/", requireRole("owner"), async (req, res, next) => {
  try {
    const { userId, family, membership } = familyContext(req);
    const { email, role } = req.body as { email?: string; role?: string };
    if (role !== "member" && role !== "admin") {
      res.status(400).json({ message: "role must be 'member' or 'admin'" });
      return;
    }
    const result = await createInvitation({
      familyId: family.id,
      role,
      inviterRole: membership.role,
      createdBy: userId,
      email: email ?? null,
    });
    res.status(201).json({ token: result.token });
  } catch (e) {
    if (e instanceof Error && e.message === "Insufficient role") {
      res.status(403).json({ message: "Insufficient role" });
      return;
    }
    next(e);
  }
});

// Accept stands alone — the invitee is not yet a member of any family here.
export const acceptInvitationRouter = Router();

acceptInvitationRouter.post(
  "/:token/accept",
  requireAuth,
  async (req, res, next) => {
    try {
      const { userId } = authContext(req);
      const { token } = req.params;
      if (typeof token !== "string" || token.length === 0) {
        res.status(400).json({ message: "Missing token" });
        return;
      }
      const result = await acceptInvitation(token, userId);
      if (result.ok) {
        res.status(204).end();
        return;
      }
      // Collapse on wire: not-found / expired / used / already-member all 409.
      // The same body for every refusal is the right amount of information.
      res.status(409).json({ message: "This invitation cannot be accepted" });
    } catch (e) {
      next(e);
    }
  },
);

// Owner-only: the list carries invitees' emails and the roles they were offered.
invitationRouter.get("/", requireRole("owner"), getFamilyInvitations);
