import { Router } from "express";
import type { ApiResponse } from "../contracts.js";
import { requireAuth } from "../middlewares/auth.js";
import { loadFamily } from "../middlewares/family.js";
import { authRouter } from "./auth.routes.js";
import { familyRouter } from "./family.routes.js";

export const apiRouter = Router();

// ---------------------------------------------------------------- public ----
apiRouter.get("/health", (_req, res) => {
  const body: ApiResponse<{ status: "ok" }> = { data: { status: "ok" } };
  res.status(200).json(body);
});

apiRouter.use("/auth", authRouter);

// ----------------------------------------------------------------- guard ----
apiRouter.use(requireAuth);

// ------------------------------------------------------------- protected ----
// :slug NAMES a family. Naming is not authorising: loadFamily proves the caller
// belongs to it, or answers 404 as if it did not exist.
apiRouter.use("/families/:slug", loadFamily, familyRouter);
