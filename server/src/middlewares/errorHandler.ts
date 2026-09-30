import type { ErrorRequestHandler } from "express";
import type { ApiErrorBody } from "../contracts.js";

// The last line of defence. Every error the application can produce ends
// here, so the client always receives the same shape.
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  const message = error instanceof Error ? error.message : "Unexpected error";
  const body: ApiErrorBody = { message };

  if (process.env.NODE_ENV !== "production") {
    console.error(error);
  }

  res.status(500).json(body);
};
