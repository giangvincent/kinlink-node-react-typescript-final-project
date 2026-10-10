import { Router } from "express";
import type { ApiResponse } from "../contracts.js";
import { requireAuth } from "../middlewares/auth.js";
import { loadFamily } from "../middlewares/family.js";
import { authRouter } from "./auth.routes.js";
import { familyRouter } from "./family.routes.js";
import {
  acceptInvitationRouter,
  invitationRouter,
} from "./invitation.routes.js";
import { getMyFamilies } from "../controllers/family.controller.js";

export const apiRouter = Router();

// ---------------------------------------------------------------- public ----
apiRouter.get("/health", (_req, res) => {
  const body: ApiResponse<{ status: "ok" }> = { data: { status: "ok" } };
  res.status(200).json(body);
});

apiRouter.use("/auth", authRouter);

// ----------------------------------------------------------------- guard ----
apiRouter.use(requireAuth);

// ------------------------------------------------------------- protected ----
// :slug NAMES a family. Naming is not authorising: loadFamily proves the caller
// belongs to it, or answers 404 as if it did not exist.
apiRouter.use("/families/:slug", loadFamily, familyRouter);

// Owners create invites scoped to a family they belong to.
apiRouter.use("/families/:slug/invitations", loadFamily, invitationRouter);

// Accept does not need loadFamily — invitee is not yet a member.
apiRouter.use("/invitations", acceptInvitationRouter);

// The list of families the caller belongs to. It resolves no :slug -- answering
// "which families are mine?" is the point -- so it rides requireAuth alone.
apiRouter.get("/families", getMyFamilies);
