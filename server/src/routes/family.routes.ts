import { Router } from "express";
import {
  leave,
  patchMemberRole,
  transferOwner,
} from "../controllers/family.controller.js";
import { getFamilyPeople } from "../controllers/people.controller.js";
import { requireRole } from "../middlewares/role.js";

// loadFamily already ran at the mount, so requireRole needs no query of its own.
export const familyRouter = Router();

familyRouter.get("/people", getFamilyPeople);

// owner-only: changing who may do what is the most dangerous operation here.
familyRouter.patch(
  "/members/:membershipId",
  requireRole("owner"),
  patchMemberRole,
);

// any member may leave; the refusal case is 409, not 403.
familyRouter.post("/leave", leave);

// owner-only, and it is the operation the last-owner refusal points at.
familyRouter.post("/transfer-ownership", requireRole("owner"), transferOwner);
