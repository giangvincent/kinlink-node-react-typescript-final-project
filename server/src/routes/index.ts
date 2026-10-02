import { Router } from "express";
import type { ApiResponse } from "../contracts.js";
import { authRouter } from "./auth.routes.js";
import { peopleRouter } from "./people.routes.js";
import { requireAuth } from "../middlewares/auth.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  const body: ApiResponse<{ status: "ok" }> = { data: { status: "ok" } };
  res.status(200).json(body);
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/people", requireAuth, peopleRouter);
