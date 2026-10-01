import { prisma } from "../config/database.js";
import type { Person as PrismaPerson } from "../../generated/prisma/client.js";

export type Person = PrismaPerson;

// familyId is now a required argument. There is no way to call this
// function without saying whose rows you want, which is what makes the
// isolation bug impossible to introduce by accident.
export async function findByFamily(familyId: string): Promise<Person[]> {
  return prisma.person.findMany({
    where: { familyId },
    orderBy: { createdAt: "asc" },
  });
}
