/** What the client is allowed to see about one family the caller belongs to. */
export interface FamilyResource {
  /** The stable handle the client puts in URLs. Not the family id. */
  slug: string;
  name: string;
  /** The caller's role here -- what the client may offer them to do. */
  role: "owner" | "admin" | "member";
}
