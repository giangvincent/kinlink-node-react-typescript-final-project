import { useEffect, useState } from "react";
import type { PersonResource } from "./contracts";
import { getPeople } from "./lib/api";

export default function App() {
  const [people, setPeople] = useState<PersonResource[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getPeople()
      .then(setPeople)
      .catch((cause: unknown) => {
        setError(cause instanceof Error ? cause.message : "Unknown error");
      });
  }, []);

  if (error) return <p role="alert">Failed to load: {error}</p>;
  if (!people) return <p>Loading…</p>;

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>KinLink</h1>
      <ul>
        {people.map((person) => (
          <li key={person.id}>
            {person.name} — {person.living ? "living" : "remembered"}
          </li>
        ))}
      </ul>
    </main>
  );
}
