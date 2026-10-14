import { onSessionEnded } from "../lib/session.js";
import { ApiError, getFamilies, login } from "../lib/api.js";

// The first runnable check that lives on the client, and it needs no test
// framework: `request` talks to global fetch, so this replaces fetch and then
// inspects what the transport announced. No DOM, no React, no port, no database.
//
// The claim under test is narrow and worth being precise about: a 401 must end
// the session when it is ABOUT the session, and must never end it when it is
// about the input. Same status code, opposite consequences.
async function main(): Promise<void> {
  let announcements = 0;
  const unsubscribe = onSessionEnded(() => {
    announcements += 1;
  });

  const respondWith = (status: number): void => {
    globalThis.fetch = (async () =>
      new Response("{}", { status })) as unknown as typeof fetch;
  };

  const swallowApiError = (work: Promise<unknown>): Promise<void> =>
    work.then(
      () => undefined,
      (cause: unknown) => {
        if (!(cause instanceof ApiError)) throw cause;
      },
    );

  respondWith(401);
  await swallowApiError(getFamilies());
  console.log(`401 on a session-carrying read -> announced: ${announcements}`);

  const beforeSignIn = announcements;
  await swallowApiError(
    login({ email: "nobody@probe.invalid", password: "no" }),
  );
  console.log(
    `401 on a sign-in attempt        -> announced: ${announcements - beforeSignIn}`,
  );

  const beforeFault = announcements;
  respondWith(500);
  await swallowApiError(getFamilies());
  console.log(
    `500 on a session-carrying read  -> announced: ${announcements - beforeFault}`,
  );

  unsubscribe();

  if (announcements !== 1) {
    throw new Error(
      `EXPECTED exactly 1 announcement, got ${announcements}: a 401 must end the ` +
        `session when it is about the session, and never when it is about input`,
    );
  }

  console.log(
    "\nsession-end announcement is scoped to the session, not to 401",
  );
}

await main();
