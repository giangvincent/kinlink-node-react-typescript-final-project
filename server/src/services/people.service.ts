import * as personModel from "../models/person.model.js";
import type { Person } from "../models/person.model.js";

/** Forward the call through to the model. The model enforces scoping. */
export async function listPeople(familyId: string): Promise<Person[]> {
  return personModel.findByFamily(familyId);
}
