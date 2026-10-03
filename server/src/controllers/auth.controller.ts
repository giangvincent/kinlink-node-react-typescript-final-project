import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import { prisma } from "../config/database.js";
import type { AuthResponse } from "../../../shared/contracts/auth.js";
import * as userModel from "../models/user.model.js";

const SALT_ROUNDS = 12;

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

    const existing = await userModel.findByEmail(email);
    if (existing) {
      res.status(409).json({ message: "Email already registered" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const { user } = await userModel.createWithOwnedFamily({
      email,
      passwordHash,
    });

    // Identity only. Which family, and what you may do there, is per request.
    req.session.userId = user.id;

    res.status(201).json({
      data: { userId: user.id, email: user.email } satisfies AuthResponse,
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
      // compare() may exit early, but it compares digests, so the fixed 2^cost
      // work dominates and an early exit leaks nothing usable. The timing signal
      // that does exist is elsewhere: a hit runs a bcrypt round and a miss does
      // not, so "no such user" and "wrong password" are distinguishable. Keep the
      // message generic and rate limit.
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    req.session.userId = user.id;

    res.status(200).json({
      data: {
        userId: user.id,
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
        email: user.email,
      } satisfies AuthResponse,
    });
  } catch (error) {
    next(error);
  }
}
