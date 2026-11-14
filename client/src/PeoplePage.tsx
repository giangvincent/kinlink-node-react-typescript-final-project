import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ApiError, getPeople } from "./lib/api";

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
