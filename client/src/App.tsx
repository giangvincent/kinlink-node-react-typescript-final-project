import { useEffect, useState } from "react";
import { Link, Route, Routes } from "react-router-dom";
import AcceptPage from "./AcceptPage";
import InvitesPage from "./InvitesPage";
import LoginScreen from "./LoginScreen";
import type { FamilyResource } from "./contracts";
import { getFamilies } from "./lib/api";
import { useSession } from "./lib/useSession";

/**
 * The families this session belongs to. Rendered only once the session is
 * known, because "which families?" is a question only an identity can answer.
 */
function FamilyList() {
  const [families, setFamilies] = useState<FamilyResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFamilies()
      .then(setFamilies)
      .catch((cause: unknown) =>
        setError(cause instanceof Error ? cause.message : "Unknown error"),
      );
  }, []);

  if (error) return <p role="alert">Failed to load: {error}</p>;
  if (!families) return <p>Loading…</p>;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>KinLink</h1>
      <ul>
        {families.map((family) => (
          <li key={family.slug}>
            <Link to={`/family/${family.slug}/invites`}>{family.name}</Link> —
            you are {family.role}
          </li>
        ))}
      </ul>
    </main>
  );
}

/** The three states of a session: unknown, absent, present. */
function Home() {
  const { state, refresh } = useSession();

  if (state.status === "loading") return <p>Checking your session…</p>;
  if (state.status === "error") return <p role="alert">{state.message}</p>;
  if (state.status === "anonymous") return <LoginScreen onSignedIn={refresh} />;
  return <FamilyList />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/invite/:token" element={<AcceptPage />} />
      <Route path="/family/:slug/invites" element={<InvitesPage />} />
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
