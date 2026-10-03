import { createApp } from "../app.js";

// A parameterised path cannot be fetched literally. The placeholder works
// precisely because requireAuth rejects BEFORE the slug is ever used, so the 401
// does not depend on its value.
const PROTECTED = ["/api/families/__probe__/people"];

async function main(): Promise<void> {
  // Port 0 asks the OS for a free port, so this never collides with `npm run dev`.
  const server = createApp().listen(0);
  await new Promise<void>((resolve, reject) => {
    server.once("listening", resolve);
    server.once("error", reject);
  });

  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected a TCP address from listen(0)");
  }
  const base = `http://127.0.0.1:${address.port}`;

  const failures: string[] = [];
  for (const path of PROTECTED) {
    const response = await fetch(`${base}${path}`);
    const passed = response.status === 401;
    console.log(`${passed ? "ok  " : "FAIL"} ${path} -> ${response.status}`);
    if (!passed) failures.push(`${path} -> ${response.status}, expected 401`);
  }

  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));

  if (failures.length > 0) {
    console.error(`\n${failures.length} guard check(s) failed`);
    process.exitCode = 1;
  } else {
    console.log(`\n${PROTECTED.length} guard check(s) passed`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
