import { Router } from "express";
import {
  register,
  login,
  logout,
  whoami,
} from "../controllers/auth.controller.js";

export const authRouter = Router();

authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", logout);
authRouter.get("/whoami", whoami);
