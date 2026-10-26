import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ApiError, acceptInvitation } from "./lib/api";

type Status = "idle" | "ok" | "needs-sign-in" | "err";

export default function AcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<Status>("idle");

  useEffect(() => {
    if (!token) return;
    acceptInvitation(token)
      .then(() => setStatus("ok"))
      .catch((cause: unknown) => {
        if (cause instanceof ApiError && cause.status === 401) {
          setStatus("needs-sign-in");
          return;
        }
        setStatus("err");
      });
  }, [token]);

  if (status === "ok") return <p>You're in — go to the family.</p>;
  if (status === "needs-sign-in")
    return <p>Sign in to accept this invitation.</p>;
  if (status === "err") return <p>This link doesn't work.</p>;
  return <p>Accepting…</p>;
}
