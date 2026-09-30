import express from "express";
import { errorHandler } from "./middlewares/errorHandler.js";
import { apiRouter } from "./routes/index.js";

// Builds the application but does NOT listen. That separation is what lets a
// test exercise the whole stack without opening a port.
export function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
