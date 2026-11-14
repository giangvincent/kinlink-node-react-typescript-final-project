import type { Gender } from "../contracts.js";
import * as personModel from "../models/person.model.js";
import type { Person, PersonInput } from "../models/person.model.js";

/** Forward the call through to the model. The model enforces scoping. */
export async function listPeople(familyId: string): Promise<Person[]> {
  return personModel.findByFamily(familyId);
}

/** A create or an edit as the wire describes it: dates are ISO strings or null. */
export interface NewPerson {
  name: string;
  gender: Gender;
  birthDate?: string | null;
  deathDate?: string | null;
}

export async function addPerson(
  familyId: string,
  input: NewPerson,
): Promise<Person> {
  return personModel.create(familyId, {
    displayName: input.name,
    gender: input.gender,
    birthDate: toDate(input.birthDate),
    deathDate: toDate(input.deathDate),
  });
}

export async function editPerson(
  familyId: string,
  personId: string,
  patch: Partial<NewPerson>,
): Promise<Person | null> {
  const changes: Partial<PersonInput> = {};
  if (patch.name !== undefined) changes.displayName = patch.name;
  if (patch.gender !== undefined) changes.gender = patch.gender;
  // `!== undefined` and not truthiness: sending null is how a date is cleared.
  if (patch.birthDate !== undefined) changes.birthDate = toDate(patch.birthDate);
  if (patch.deathDate !== undefined) changes.deathDate = toDate(patch.deathDate);

  return personModel.update(personId, familyId, changes);
}

export async function removePerson(
  familyId: string,
  personId: string,
): Promise<boolean> {
  return personModel.remove(personId, familyId);
}

/** An ISO date string from the wire as a `Date`, or null for "no date". */
function toDate(value: string | null | undefined): Date | null {
  return value == null || value === "" ? null : new Date(value);
}
