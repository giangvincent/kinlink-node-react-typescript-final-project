import { Router } from "express";
import { getPeople } from "../controllers/people.controller.js";

export const peopleRouter = Router();

peopleRouter.get("/", getPeople);
