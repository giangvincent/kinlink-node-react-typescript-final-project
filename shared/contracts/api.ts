export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorBody {
  message: string;
  errors?: Record<string, string[]>;
}

/** Why the server refused -- the field the client branches on. Never parse detail. */
export type ProblemCode = "last_owner" | "not_owner";

/** The way out of a refusal, as data: what to call, and with whom. */
export interface TransferRemediation {
  action: "transfer_ownership";
  method: "POST";
  href: string;
  candidates: { membershipId: string; email: string }[];
}

/** RFC 9457 problem details plus KinLink's extensions. Served as problem+json. */
export interface ApiProblem {
  type: string;
  title: string;
  status: number;
  code: ProblemCode;
  detail: string;
  remediation?: TransferRemediation;
}
