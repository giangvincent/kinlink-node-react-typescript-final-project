import type { PersonResource } from "../contracts.js";
import type { Person } from "../models/person.model.js";

export function toPersonResource(person: Person): PersonResource {
  return {
    id: person.id,
    name: person.displayName,
    living: person.deathDate === null,
  };
}
