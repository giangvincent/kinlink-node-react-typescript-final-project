import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError, login, register } from "./lib/api";

/**
 * The screen the client shows when the server says "I do not know you".
 *
 * Login and register are one form because they are one question -- "who are
 * you?" -- and the only difference is which endpoint answers. Both leave a
 * session cookie behind, which is why success just refreshes the session.
 */
export default function LoginScreen({
  onSignedIn,
}: {
  onSignedIn: () => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await (mode === "login"
        ? login({ email, password })
        : register({ email, password }));
      onSignedIn();
    } catch (cause: unknown) {
      setError(
        cause instanceof ApiError && cause.status === 401
          ? "Wrong email or password."
          : "That did not work. Try again.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>KinLink</h1>
      <h2>{mode === "login" ? "Log in" : "Create your family"}</h2>

      <form onSubmit={submit}>
        <p>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email"
            required
          />
        </p>
        <p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="password"
            required
          />
        </p>
        <button type="submit" disabled={pending}>
          {pending ? "Working…" : mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>

      {error && <p role="alert">{error}</p>}

      <p>
        <button
          type="button"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
      </p>
    </main>
  );
}
