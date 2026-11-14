import type { NextFunction, Request, Response } from "express";
import type {
  ApiResponse,
  CreatePersonRequest,
  Gender,
  PersonResource,
  UpdatePersonRequest,
} from "../contracts.js";
import { familyContext } from "../middlewares/family.js";
import {
  addPerson,
  editPerson,
  listPeople,
  removePerson,
} from "../services/people.service.js";
import { toPersonResource } from "../views/person.view.js";

const GENDERS = ["male", "female", "other", "unknown"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isGender(value: unknown): value is Gender {
  return typeof value === "string" && (GENDERS as readonly string[]).includes(value);
}

/** A `YYYY-MM-DD` string, or a null/"" that means "no date". */
function parseDate(
  value: unknown,
): { ok: true; value: string | null } | { ok: false } {
  if (value === undefined || value === null || value === "") {
    return { ok: true, value: null };
  }
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    return { ok: false };
  }
  return { ok: true, value };
}

/** Validate a create body, or name the first thing wrong with it. */
function parseCreate(
  body: unknown,
): { input: CreatePersonRequest } | { error: string } {
  if (!isRecord(body)) return { error: "Body must be a JSON object" };

  const { name, gender } = body;
  if (typeof name !== "string" || name.trim() === "" || name.trim().length > 200) {
    return { error: "name must be a non-empty string of at most 200 characters" };
  }
  if (!isGender(gender)) {
    return { error: `gender must be one of ${GENDERS.join(", ")}` };
  }
  const birthDate = parseDate(body.birthDate);
  const deathDate = parseDate(body.deathDate);
  if (!birthDate.ok || !deathDate.ok) {
    return { error: "birthDate and deathDate must be ISO dates or null" };
  }
  return {
    input: {
      name: name.trim(),
      gender,
      birthDate: birthDate.value,
      deathDate: deathDate.value,
    },
  };
}

/** Validate a partial edit: only the fields present are checked. */
function parseUpdate(
  body: unknown,
): { patch: UpdatePersonRequest } | { error: string } {
  if (!isRecord(body)) return { error: "Body must be a JSON object" };

  const patch: UpdatePersonRequest = {};
  if (body.name !== undefined) {
    if (
      typeof body.name !== "string" ||
      body.name.trim() === "" ||
      body.name.trim().length > 200
    ) {
      return { error: "name must be a non-empty string of at most 200 characters" };
    }
    patch.name = body.name.trim();
  }
  if (body.gender !== undefined) {
    if (!isGender(body.gender)) {
      return { error: `gender must be one of ${GENDERS.join(", ")}` };
    }
    patch.gender = body.gender;
  }
  for (const key of ["birthDate", "deathDate"] as const) {
    const value = body[key];
    if (value === undefined) continue;
    const parsed = parseDate(value);
    if (!parsed.ok) return { error: `${key} must be an ISO date or null` };
    patch[key] = parsed.value;
  }
  if (Object.keys(patch).length === 0) {
    return { error: "No editable fields were provided" };
  }
  return { patch };
}

export async function getFamilyPeople(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // The controller does not name a family and does not read the session. It asks
    // for the family the request was authorised against -- already proven.
    const { family } = familyContext(req);
    const people = await listPeople(family.id);

    const body: ApiResponse<PersonResource[]> = {
      data: people.map(toPersonResource),
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}

export async function createFamilyPerson(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { family } = familyContext(req);
    const parsed = parseCreate(req.body);
    if ("error" in parsed) {
      res.status(400).json({ message: parsed.error });
      return;
    }

    const person = await addPerson(family.id, parsed.input);

    const body: ApiResponse<PersonResource> = { data: toPersonResource(person) };
    res.status(201).json(body);
  } catch (error) {
    next(error);
  }
}

export async function updateFamilyPerson(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { family } = familyContext(req);
    // Express 5: a param is `string | string[] | undefined` until narrowed.
    const { personId } = req.params;
    const parsed = parseUpdate(req.body);
    if ("error" in parsed) {
      res.status(400).json({ message: parsed.error });
      return;
    }
    if (typeof personId !== "string") {
      res.status(404).json({ message: "Person not found" });
      return;
    }

    const person = await editPerson(family.id, personId, parsed.patch);
    if (person === null) {
      res.status(404).json({ message: "Person not found" });
      return;
    }

    const body: ApiResponse<PersonResource> = { data: toPersonResource(person) };
    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}

export async function deleteFamilyPerson(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { family } = familyContext(req);
    const { personId } = req.params;
    if (typeof personId !== "string") {
      res.status(404).json({ message: "Person not found" });
      return;
    }

    const removed = await removePerson(family.id, personId);
    if (!removed) {
      res.status(404).json({ message: "Person not found" });
      return;
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}
