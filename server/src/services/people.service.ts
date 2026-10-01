import * as personModel from "../models/person.model.js";
import type { Person } from "../models/person.model.js";

// Until login exists there is no session, so we stand in for one. Week 3
// lesson replaces this with the real value read off the session cookie.
const CURRENT_FAMILY_ID = "18321796-bfab-4c2a-9959-b17c4b0acb65";

export async function listPeople(familyId: string): Promise<Person[]> {
  return personModel.findByFamily(familyId);
}

export async function listPeopleForCurrentFamily(): Promise<Person[]> {
  return listPeople(CURRENT_FAMILY_ID);
}
