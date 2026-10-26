import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import type { InvitationResource } from "./contracts";
import { ApiError, createInvitation, getInvitations } from "./lib/api";

function addressee(invitation: InvitationResource): string {
  return invitation.email ?? "Anyone with the link";
}

function MintInvite({
  slug,
  onMinted,
}: {
  slug: string;
  onMinted: () => void;
}) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const created = await createInvitation(slug, {
        email: email.trim() === "" ? null : email.trim(),
        role,
      });
      setToken(created.token);
      onMinted();
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 409) {
        setError("That email already has a pending invitation.");
      } else if (cause instanceof ApiError && cause.status === 403) {
        setError("You need to be an owner to invite.");
      } else {
        setError("Could not send the invitation.");
      }
    }
  };

  return (
    <form onSubmit={submit}>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email (blank = shareable link)"
      />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as "member" | "admin")}
      >
        <option value="member">member</option>
        <option value="admin">admin</option>
      </select>
      <button type="submit">Send invite</button>

      {error && <p role="alert">{error}</p>}
      {token && (
        <p>
          Share once — this is the only time it is shown:{" "}
          <code>
            {window.location.origin}/invite/{token}
          </code>
        </p>
      )}
    </form>
  );
}

export default function InvitesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [invitations, setInvitations] = useState<InvitationResource[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!slug) return;
    getInvitations(slug)
      .then(setInvitations)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Unknown error"),
      );
  }, [slug, nonce]);

  if (!slug) return <p>No family in the URL.</p>;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Pending invitations</h1>
      <MintInvite slug={slug} onMinted={() => setNonce((n) => n + 1)} />
      {error && <p role="alert">Failed to load: {error}</p>}
      {!error && invitations === null && <p>Loading…</p>}
      {invitations?.length === 0 && <p>No pending invitations.</p>}
      {invitations && invitations.length > 0 && (
        <ul>
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              {addressee(invitation)} — {invitation.role} — sent{" "}
              {new Date(invitation.createdAt).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
