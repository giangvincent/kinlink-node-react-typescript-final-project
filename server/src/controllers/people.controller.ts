import type { NextFunction, Request, Response } from "express";
import type { ApiResponse, PersonResource } from "../contracts.js";
import { listPeople } from "../services/people.service.js";
import { toPersonResource } from "../views/person.view.js";

interface RequestWithAuth extends Request {
  authenticatedUserId: string;
  authenticatedFamilyId: string;
}

export async function getPeople(
  req: RequestWithAuth,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const people = await listPeople(req.authenticatedFamilyId);
    const body: ApiResponse<PersonResource[]> = {
      data: people.map(toPersonResource),
    };

    res.status(200).json(body);
  } catch (error) {
    next(error);
  }
}
