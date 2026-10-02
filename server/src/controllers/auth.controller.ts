import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";
import type { AuthResponse } from "../../../shared/contracts/auth.js";

/**
 * Register a new user. Creates the account, hashes the password, assigns the
 * user to the specified family, and logs them in immediately.
 *
 * In production you would separate registration from login: create the account,
 * send an email confirmation, then let them log in separately. For this lesson
 * we combine both steps to keep the loop tight.
 */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    // 1. Check uniqueness before hashing — cheap failure
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    // 2. Hash the password (cost factor 12 is recommended for modern hardware)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Look up the target family (you could also auto-create during invite flow)
    // For this lesson: look up by slug to establish family membership.
    const family = await prisma.family.findFirst({
      where: { slug: "nguyen" }, // replace with user selection in future
    });
    if (!family) {
      res.status(404).json({ message: "Family not found" });
      return;
    }

    // 4. Create user with session association
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        familyId: family.id,
      },
    });

    // 5. Log them in
    req.session.userId = user.id;
    req.session.familyId = family.id;

    res.status(201).json({
      data: {
        userId: user.id,
        familyId: family.id,
        email: user.email,
      } satisfies AuthResponse,
    });
  } catch (error) {
    next(error);
  }
}

/** Login with email and password */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password }: { email: string; password: string } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      // Constant-time comparison on the hash, but timing still leaks that the
      // email exists (user not found ≠ wrong password). Preventing user enumeration
      // requires more care (rate limiting, generic messages). Acknowledge the leak.
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    req.session.userId = user.id;
    req.session.familyId = user.familyId;

    res.status(200).json({
      data: {
        userId: user.id,
        familyId: user.familyId,
        email: user.email,
      } satisfies AuthResponse,
    });
  } catch (error) {
    next(error);
  }
}

/** Destroy the session */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    req.session.destroy((err) => {
      if (err) {
        next(err);
        return;
      }
      res.clearCookie("kinlink.sid");
      res.status(204).end();
    });
  } catch (error) {
    next(error);
  }
}

/** Return the authenticated user's info (no sensitive data) */
export async function whoami(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.session.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    const user = await prisma.user.findUnique({
      select: { id: true, email: true, familyId: true },
      where: { id: userId },
    });
    if (!user) {
      res.status(401).json({ message: "Session invalid" });
      return;
    }

    res.status(200).json({
      data: {
        userId: user.id,
        familyId: user.familyId,
        email: user.email,
      } satisfies AuthResponse,
    });
  } catch (error) {
    next(error);
  }
}
