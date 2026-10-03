import type { NextFunction, Request, Response } from "express";
import type { ApiResponse, PersonResource } from "../contracts.js";
import { familyContext } from "../middlewares/family.js";
import { listPeople } from "../services/people.service.js";
import { toPersonResource } from "../views/person.view.js";

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
