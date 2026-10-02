import type { NextFunction, Request, Response } from "express";
import type { ApiResponse, PersonResource } from "../contracts.js";
import { authContext } from "../middlewares/auth.js";
import { listPeople } from "../services/people.service.js";
import { toPersonResource } from "../views/person.view.js";

export async function getPeople(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { familyId } = authContext(req);
    const people = await listPeople(familyId);

    const body: ApiResponse<PersonResource[]> = {
      data: people.map(toPersonResource),
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}
