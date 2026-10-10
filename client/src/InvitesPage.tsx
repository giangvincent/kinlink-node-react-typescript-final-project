import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { InvitationResource } from "./contracts";
import { getInvitations } from "./lib/api";

/**
 * The label rule from lesson 12, in one place: a null email is a shareable link,
 * not a person whose identity is being withheld.
 */
function addressee(invitation: InvitationResource): string {
  return invitation.email ?? "Anyone with the link";
}

export default function InvitesPage() {
  const { slug } = useParams<{ slug: string }>();
  const [invitations, setInvitations] = useState<InvitationResource[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    getInvitations(slug)
      .then(setInvitations)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Unknown error"),
      );
  }, [slug]);

  if (error) return <p role="alert">Failed to load: {error}</p>;
  if (!invitations) return <p>Loading…</p>;
  if (invitations.length === 0) return <p>No pending invitations.</p>;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Pending invitations</h1>
      <ul>
        {invitations.map((invitation) => (
          <li key={invitation.id}>
            {addressee(invitation)} — {invitation.role} — sent{" "}
            {new Date(invitation.createdAt).toLocaleDateString()}
          </li>
        ))}
      </ul>
    </main>
  );
}
