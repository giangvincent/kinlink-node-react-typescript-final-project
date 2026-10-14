import { useCallback, useEffect, useState } from "react";
import type { AuthResponse } from "../contracts";
import { ApiError, getSession } from "./api";
import { onSessionEnded } from "./session";

export type SessionState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "error"; message: string }
  | { status: "authenticated"; user: AuthResponse };

/**
 * Who is this browser, according to the server?
 *
 * The session lives on the server, so the truth is fetched, never mirrored into
 * a client store. Three outcomes, three states: a 401 is "not logged in" -- an
 * ordinary state the UI renders a login form for -- while anything else is a
 * fault worth showing.
 */
export function useSession(): { state: SessionState; refresh: () => void } {
  const [state, setState] = useState<SessionState>({ status: "loading" });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let live = true;

    getSession()
      .then((user) => {
        if (live) setState({ status: "authenticated", user });
      })
      .catch((cause: unknown) => {
        if (!live) return;
        if (cause instanceof ApiError && cause.status === 401) {
          setState({ status: "anonymous" });
          return;
        }
        setState({
          status: "error",
          message: cause instanceof Error ? cause.message : "Unknown error",
        });
      });

    return () => {
      live = false;
    };
  }, [nonce]);

  // Any request, on any screen, can be the one that discovers the session is
  // gone. Subscribe once here so the app lands on the login screen whichever
  // call found out -- and so no screen has to handle a 401 itself.
  useEffect(() => onSessionEnded(() => setState({ status: "anonymous" })), []);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  return { state, refresh };
}
