import { prisma } from "../config/database.js";
import type { Person as PrismaPerson } from "../../generated/prisma/client.js";

// The model layer re-exports the ORM's type, so no layer above it has to know
// that Prisma exists. If we swap Prisma for something else in two years, this
// import and these query bodies are the entire blast radius.
export type Person = PrismaPerson;

export async function findAll(): Promise<Person[]> {
  return prisma.person.findMany({ orderBy: { createdAt: "asc" } });
}
