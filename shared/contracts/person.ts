export type Gender = "male" | "female" | "other" | "unknown";

/** What the client is allowed to see. Not the same as a database row. */
export interface PersonResource {
  id: string;
  familyId: string;
  name: string;
  living: boolean;
}
