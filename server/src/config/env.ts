function readPort(): number {
  const raw = process.env.PORT ?? "4000";
  const port = Number(raw);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(`PORT must be a positive integer, received "${raw}"`);
  }

  return port;
}

export const env = {
  port: readPort(),
  nodeEnv: process.env.NODE_ENV ?? "development",
} as const;
