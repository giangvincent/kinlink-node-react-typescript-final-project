import { randomUUID } from "node:crypto";
import { prisma } from "../config/database.js";
import type { User as PrismaUser } from "../../generated/prisma/client.js";

export type User = PrismaUser;

export async function findByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findById(
  id: string,
): Promise<{ id: string; email: string } | null> {
  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true },
  });
}

/**
 * A new account: the user, the family they own, and the membership linking them.
 *
 * One transaction, because those three rows are one fact. It lives in the model
 * rather than the service because a transaction boundary is a data-integrity
 * boundary and queries belong to this layer -- and because it is currently the
 * only operation that needs a Prisma transaction handle. When a second one
 * appears, extract a `Db` type and thread it through the model functions instead
 * of growing this pattern by hand.
 */
export async function createWithOwnedFamily(input: {
  email: string;
  passwordHash: string;
}): Promise<{ user: User; familyId: string }> {
  const local = input.email.split("@")[0] ?? "family";
  const base =
    local
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "family";

  return prisma.$transaction(async (tx) => {
    const family = await tx.family.create({
      data: {
        // A short random suffix makes the slug unique without a retry loop.
        slug: `${base}-${randomUUID().slice(0, 6)}`,
        name: `${local}'s family`,
      },
    });

    const user = await tx.user.create({
      data: { email: input.email, passwordHash: input.passwordHash },
    });

    await tx.familyMember.create({
      data: { userId: user.id, familyId: family.id, role: "owner" },
    });

    return { user, familyId: family.id };
  });
}
