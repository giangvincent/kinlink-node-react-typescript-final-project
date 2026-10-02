import { Router } from "express";
import type { ApiResponse } from "../contracts.js";
import { requireAuth } from "../middlewares/auth.js";
import { authRouter } from "./auth.routes.js";
import { peopleRouter } from "./people.routes.js";

export const apiRouter = Router();

// ---------------------------------------------------------------- public ----
// Deliberately reachable without a session. Everything above the guard is a
// decision someone made on purpose.
apiRouter.get("/health", (_req, res) => {
  const body: ApiResponse<{ status: "ok" }> = { data: { status: "ok" } };
  res.status(200).json(body);
});

apiRouter.use("/auth", authRouter);

// ----------------------------------------------------------------- guard ----
// Everything below this line is authenticated. There is no argument to forget
// and no per-route annotation to copy; a new router added down here is
// protected the moment it is mounted.
apiRouter.use(requireAuth);

// ------------------------------------------------------------- protected ----
apiRouter.use("/people", peopleRouter);
