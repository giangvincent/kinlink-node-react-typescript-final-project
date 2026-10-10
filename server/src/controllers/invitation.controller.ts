import type { NextFunction, Request, Response } from "express";
import type { ApiResponse, InvitationResource } from "../contracts.js";
import { familyContext } from "../middlewares/family.js";
import { listPendingInvitations } from "../services/invitation.service.js";
import { toInvitationResource } from "../views/invitation.view.js";

/**
 * The invitations a family can still act on.
 *
 * The controller names no family and does not read the session. It asks for the
 * family the request was authorised against -- loadFamily already proved the
 * caller belongs to it. The slug is never re-read from the URL here; the proof
 * is the middleware's, and the id is the only trustworthy handle it left behind.
 */
export async function getFamilyInvitations(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { family } = familyContext(req);
    const invitations = await listPendingInvitations(family.id);

    const body: ApiResponse<InvitationResource[]> = {
      data: invitations.map(toInvitationResource),
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}
