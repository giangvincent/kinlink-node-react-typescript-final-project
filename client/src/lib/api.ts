import type { ApiResponse, PersonResource } from "../contracts";

// Components call functions with names and types, never URLs.
export async function getPeople(): Promise<PersonResource[]> {
  const response = await fetch("/api/people");

  if (!response.ok) {
    throw new Error(`GET /api/people failed with status ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<PersonResource[]>;
  return body.data;
}
