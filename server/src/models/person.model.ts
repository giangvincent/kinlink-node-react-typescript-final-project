import type { Gender } from "../contracts.js";

export interface Person {
  id: string;
  familyId: string;
  displayName: string;
  gender: Gender;
  birthDate: string | null;
  deathDate: string | null;
}

// The Model layer. Lesson 02 replaces this array with Prisma queries --
// and nothing above this file will need to change.
const people: Person[] = [
  {
    id: "p_1",
    familyId: "f_1",
    displayName: "Nguyễn Văn An",
    gender: "male",
    birthDate: "1948-03-02",
    deathDate: null,
  },
  {
    id: "p_2",
    familyId: "f_1",
    displayName: "Trần Thị Bình",
    gender: "female",
    birthDate: "1952-07-19",
    deathDate: null,
  },
];

export async function findAll(): Promise<Person[]> {
  return people;
}
