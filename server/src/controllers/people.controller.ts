import type { NextFunction, Request, Response } from "express";
import type { ApiResponse, PersonResource } from "../contracts.js";
import { listPeopleForCurrentFamily } from "../services/people.service.js";
import { toPersonResource } from "../views/person.view.js";

export async function getPeople(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const people = await listPeopleForCurrentFamily();
    const body: ApiResponse<PersonResource[]> = {
      data: people.map(toPersonResource),
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}
