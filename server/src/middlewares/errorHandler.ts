import type { ErrorRequestHandler } from "express";
import type { ApiErrorBody } from "../contracts.js";

const isProduction = process.env.NODE_ENV === "production";

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  // Never in production: a database error message can contain the host,
  // the username and the query. Log it for you; never send it to them.
  if (!isProduction) console.error(error);

  const body: ApiErrorBody = isProduction
    ? { message: "Internal server error" }
    : { message: error instanceof Error ? error.message : "Unexpected error" };

  res.status(500).json(body);
};
