import * as personModel from "../models/person.model.js";
import type { Person } from "../models/person.model.js";

export async function listPeople(): Promise<Person[]> {
  return personModel.findAll();
}
