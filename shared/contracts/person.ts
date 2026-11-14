export type Gender = "male" | "female" | "other" | "unknown";

/** What the client is allowed to see. Not the same as a database row. */
export interface PersonResource {
  id: string;
  name: string;
  living: boolean;
}

/** The body of a create: every field the client may set, and nothing else. */
export interface CreatePersonRequest {
  name: string;
  gender: Gender;
  birthDate?: string | null;
  deathDate?: string | null;
}

/** A partial edit: send only the fields that changed. */
export type UpdatePersonRequest = Partial<CreatePersonRequest>;
