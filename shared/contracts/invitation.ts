/** What the client is allowed to see about one invitation. Not a database row. */
export interface InvitationResource {
  id: string;
  /** null = a shareable link; the client labels it, it does not invent a name. */
  email: string | null;
  role: "owner" | "admin" | "member";
  /** ISO-8601. JSON has no Date type, so the wire carries strings. */
  createdAt: string;
  expiresAt: string;
}
