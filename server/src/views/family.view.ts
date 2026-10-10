import type { FamilyResource } from "../contracts.js";
import type { Family, FamilyMember } from "../models/membership.model.js";

/**
 * The membership as the client may see it: which family, what it is called, and
 * what this caller may do there.
 *
 * The family id never crosses this line. The slug is the handle the client puts
 * in a URL, and an id it never sees is an id it cannot pass back to a route that
 * might trust it.
 */
export function toFamilyResource(
  row: FamilyMember & { family: Family },
): FamilyResource {
  return { slug: row.family.slug, name: row.family.name, role: row.role };
}
