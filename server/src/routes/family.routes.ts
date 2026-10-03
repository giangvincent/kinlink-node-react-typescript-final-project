import { Router } from "express";
import { getFamilyPeople } from "../controllers/people.controller.js";

// Note: no `mergeParams` and no reading of :slug. loadFamily already resolved the
// family and put it on the request; re-reading the parameter down here would mean
// a second lookup and a second chance to trust a string.
export const familyRouter = Router();

familyRouter.get("/people", getFamilyPeople);
