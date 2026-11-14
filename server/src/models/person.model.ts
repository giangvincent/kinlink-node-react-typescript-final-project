import { prisma } from "../config/database.js";
import type { Db } from "./db.js";
import type {
  Gender,
  Person as PrismaPerson,
} from "../../generated/prisma/client.js";

export type Person = PrismaPerson;

/** The columns a create or an edit is allowed to set. */
export interface PersonInput {
  displayName: string;
  gender: Gender;
  birthDate?: Date | null;
  deathDate?: Date | null;
}

// familyId is now a required argument. There is no way to call this
// function without saying whose rows you want, which is what makes the
// isolation bug impossible to introduce by accident.
export async function findByFamily(
  familyId: string,
  database: Db = prisma,
): Promise<Person[]> {
  return database.person.findMany({
    where: { familyId },
    orderBy: { createdAt: "asc" },
  });
}

export async function create(
  familyId: string,
  input: PersonInput,
  database: Db = prisma,
): Promise<Person> {
  return database.person.create({
    data: {
      familyId,
      displayName: input.displayName,
      gender: input.gender,
      birthDate: input.birthDate ?? null,
      deathDate: input.deathDate ?? null,
    },
  });
}

/**
 * A scoped update. `updateMany` filters on BOTH id and familyId, so a person
 * from another family matches no row -- and `count` is how the caller learns
 * there was nothing to change, rather than a 500 from an unscoped `update`.
 */
export async function update(
  id: string,
  familyId: string,
  patch: Partial<PersonInput>,
  database: Db = prisma,
): Promise<Person | null> {
  const { count } = await database.person.updateMany({
    where: { id, familyId },
    data: patch,
  });
  if (count === 0) return null;
  return database.person.findUnique({ where: { id } });
}

export async function remove(
  id: string,
  familyId: string,
  database: Db = prisma,
): Promise<boolean> {
  const { count } = await database.person.deleteMany({ where: { id, familyId } });
  return count > 0;
}
