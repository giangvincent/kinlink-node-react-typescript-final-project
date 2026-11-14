import "dotenv/config";
import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import * as personModel from "../models/person.model.js";
import { addPerson, listPeople } from "../services/people.service.js";
import { toPersonResource } from "../views/person.view.js";

// Two families. A person written into one must be readable in that one and
// invisible in the other, and the same familyId scope that protects the read
// must protect the write.
async function main(): Promise<void> {
  const suffix = randomUUID().slice(0, 8);
  const mine = await prisma.family.create({
    data: { slug: `probe-people-${suffix}`, name: "People probe" },
  });
  const theirs = await prisma.family.create({
    data: { slug: `probe-elsewhere-${suffix}`, name: "Elsewhere probe" },
  });

  try {
    await addPerson(mine.id, {
      name: "Nguyễn Văn A",
      gender: "male",
      birthDate: "1980-04-12",
      deathDate: null,
    });

    const resources = (await listPeople(mine.id)).map(toPersonResource);
    const elsewhere = await listPeople(theirs.id);
    const first = resources[0];

    console.log(`people in the family:  ${resources.length}`);
    console.log(`name:                  ${JSON.stringify(first?.name)}`);
    console.log(`living (no death date): ${first?.living}`);

    if (resources.length !== 1) {
      throw new Error(`EXPECTED 1 person, got ${resources.length}`);
    }
    if (!first) throw new Error("MISSING: the created person was not listed");
    if (first.name !== "Nguyễn Văn A") {
      throw new Error("NAME: the display name did not round-trip");
    }
    if (!first.living) {
      throw new Error("LIVING: a person with no death date must be living");
    }
    if (elsewhere.length !== 0) {
      throw new Error("LEAK: another family saw this person");
    }
    if (resources.some((row) => "familyId" in row)) {
      throw new Error("LEAK: the family id crossed the view");
    }

    // The scoped write: a person in another family is not updatable or
    // removable, and the answer is "no such row", not a 500.
    const stolen = await personModel.update(first.id, theirs.id, {
      displayName: "stolen",
    });
    if (stolen !== null) {
      throw new Error("LEAK: a cross-family update succeeded");
    }
    const removed = await personModel.remove(first.id, theirs.id);
    if (removed) {
      throw new Error("LEAK: a cross-family delete succeeded");
    }

    console.log("\npeople scoping, view mapping and scoped writes all held");
  } finally {
    await prisma.family.deleteMany({
      where: { id: { in: [mine.id, theirs.id] } },
    });
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
