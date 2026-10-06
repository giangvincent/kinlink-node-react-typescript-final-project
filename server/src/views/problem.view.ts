import type {
  ApiProblem,
  ProblemCode,
  TransferRemediation,
} from "../contracts.js";
import type { MemberCandidate } from "../models/membership.model.js";

// One place that turns a refusal into its wire shape. The title belongs to the
// problem TYPE and never changes per occurrence; `detail` is per occurrence.
const TITLES: Record<ProblemCode, string> = {
  last_owner: "A family must keep at least one owner",
  not_owner: "Your role changed while this request was in flight",
};

export function problem(input: {
  code: ProblemCode;
  status: number;
  detail: string;
  remediation?: TransferRemediation;
}): ApiProblem {
  return {
    type: `/problems/${input.code}`,
    title: TITLES[input.code],
    status: input.status,
    code: input.code,
    detail: input.detail,
    ...(input.remediation ? { remediation: input.remediation } : {}),
  };
}

export function lastOwnerProblem(
  slug: string,
  candidates: MemberCandidate[],
): ApiProblem {
  return problem({
    code: "last_owner",
    status: 409,
    detail: "Promote another member or transfer ownership, then try again.",
    remediation: {
      action: "transfer_ownership",
      method: "POST",
      href: `/api/families/${slug}/transfer-ownership`,
      candidates,
    },
  });
}
