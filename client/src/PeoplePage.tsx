import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import type { Gender } from "./contracts";
import { ApiError, createPerson, getPeople } from "./lib/api";

const GENDERS = ["male", "female", "other", "unknown"] as const;

function isGender(value: unknown): value is Gender {
  return (
    typeof value === "string" && (GENDERS as readonly string[]).includes(value)
  );
}

function AddPersonForm({ slug }: { slug: string }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<Gender>("unknown");
  const [error, setError] = useState<string | null>(null);

  const add = useMutation({
    mutationFn: (input: { name: string; gender: Gender }) =>
      createPerson(slug, input),
    onSuccess: () => {
      setName("");
      setError(null);
      void queryClient.invalidateQueries({ queryKey: peopleKey(slug) });
    },
    onError: () => setError("That did not work. Try again."),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed === "") {
      setError("A name is required.");
      return;
    }
    add.mutate({ name: trimmed, gender });
  };

  return (
    <form onSubmit={submit}>
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
      />
      <select
        value={gender}
        onChange={(event) => {
          if (isGender(event.target.value)) setGender(event.target.value);
        }}
      >
        {GENDERS.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button type="submit" disabled={add.isPending}>
        {add.isPending ? "Adding…" : "Add person"}
      </button>
      {error && <span role="alert"> {error}</span>}
    </form>
  );
}

/**
 * The key every query and mutation for one family's people shares. A mutation
 * that invalidates this exact key is what turns "the server changed" into "the
 * list re-fetched" -- the whole reason a cache exists.
 */
export const peopleKey = (slug: string) => ["people", slug] as const;

export default function PeoplePage() {
  const { slug } = useParams<{ slug: string }>();
  if (!slug) return <p role="alert">No family in this URL.</p>;
  return <PeopleList slug={slug} />;
}

function PeopleList({ slug }: { slug: string }) {
  const query = useQuery({
    queryKey: peopleKey(slug),
    queryFn: () => getPeople(slug),
  });

  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>People</h1>
      <p>
        <Link to={`/family/${slug}/invites`}>Invitations</Link>
      </p>

      <AddPersonForm slug={slug} />

      {query.isPending && <p>Loading…</p>}
      {query.isError && (
        <p role="alert">
          {query.error instanceof ApiError
            ? `Failed to load (${query.error.status}).`
            : "Failed to load."}
        </p>
      )}
      {query.data?.length === 0 && <p>No people yet.</p>}
      {query.data && query.data.length > 0 && (
        <ul>
          {query.data.map((person) => (
            <li key={person.id}>
              {person.name} {person.living ? "· living" : "· deceased"}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
