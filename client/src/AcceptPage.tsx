import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

export default function AcceptPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"idle" | "ok" | "err">("idle");

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invitations/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      credentials: "include",
    }).then((r) => setStatus(r.status === 204 ? "ok" : "err"));
  }, [token]);

  if (status === "ok") return <p>You're in — go to the family.</p>;
  if (status === "err") return <p>This link doesn't work.</p>;
  return <p>Accepting…</p>;
}
