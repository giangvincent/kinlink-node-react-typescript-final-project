import type {
  ApiResponse,
  AuthResponse,
  FamilyResource,
  InvitationResource,
} from "../contracts";

/**
 * A failed response, carrying the status so callers can tell "you are not logged
 * in" (401) from "the server broke" (500). Lesson 05 drew that line on the
 * server; this is the client finally consuming it.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * One fetch, one envelope. Components call named functions with types, never
 * URLs, and nothing here throws for a 401 -- it throws an ApiError, and the
 * caller decides what a 401 means.
 */
async function request<T>(
  path: string,
  options: { method?: "GET" | "POST"; body?: unknown } = {},
): Promise<T> {
  const response = await fetch(path, {
    method: options.method ?? "GET",
    credentials: "include",
    headers:
      options.body === undefined
        ? undefined
        : { "Content-Type": "application/json" },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      `${options.method ?? "GET"} ${path} -> ${response.status}`,
    );
  }
  if (response.status === 204) {
    return undefined as T;
  }

  const body = (await response.json()) as ApiResponse<T>;
  return body.data;
}

export function getSession(): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/whoami");
}

export function login(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: input,
  });
}

export function register(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
  });
}

export function getFamilies(): Promise<FamilyResource[]> {
  return request<FamilyResource[]>("/api/families");
}

export function getInvitations(slug: string): Promise<InvitationResource[]> {
  return request<InvitationResource[]>(
    `/api/families/${encodeURIComponent(slug)}/invitations`,
  );
}
