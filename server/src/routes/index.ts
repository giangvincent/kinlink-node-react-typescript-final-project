import { Router } from "express";
import type { ApiResponse } from "../contracts.js";
import { peopleRouter } from "./people.routes.js";

export const apiRouter = Router();

// A liveness check has no business rules and touches nothing, so it does not
// deserve a controller. Inline is the honest choice here.
apiRouter.get("/health", (_req, res) => {
  const body: ApiResponse<{ status: "ok" }> = { data: { status: "ok" } };
  res.status(200).json(body);
});

apiRouter.use("/people", peopleRouter);
