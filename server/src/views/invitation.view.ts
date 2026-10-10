import type { InvitationResource } from "../contracts.js";
import type { Invitation } from "../models/invitation.model.js";

/**
 * The row as the client may see it.
 *
 * The token hash never crosses this line -- there is no field for it to travel
 * in. The two dates become ISO strings because JSON has no Date, and the view
 * is the only place that decision is made.
 */
export function toInvitationResource(row: Invitation): InvitationResource {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt.toISOString(),
    expiresAt: row.expiresAt.toISOString(),
  };
}
