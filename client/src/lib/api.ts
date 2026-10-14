import type {
  ApiResponse,
  AuthResponse,
  FamilyResource,
  InvitationResource,
} from "../contracts";
import { announceSessionEnded } from "./session";

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
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    /**
     * Does this request carry the caller's session?
     *
     * A 401 answers two different questions and the caller is the only one who
     * knows which was asked: on a session-carrying request it means "your
     * session is gone" -- a fact about the whole app; on a sign-in request it
     * means "those credentials are wrong" -- a verdict on this form's input.
     * Same status code, opposite blast radius.
     */
    expectsSession?: boolean;
  } = {},
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
    // The transport cannot tell the two 401s apart; the caller opted in above.
    // Announcing here is what makes the fix reach every screen at once instead
    // of each screen growing its own "Failed to load: ... 401" branch.
    if (response.status === 401 && (options.expectsSession ?? true)) {
      announceSessionEnded();
    }
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
    expectsSession: false,
  });
}

export function register(input: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: input,
    expectsSession: false,
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
