import "express-session";
import type { Family, FamilyMember } from "../models/membership.model.js";

declare module "express-session" {
  interface SessionData {
    // Identity only. WHICH family, and what you may do there, is per-request
    // context resolved in loadFamily -- never remembered across requests.
    userId?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      authenticatedUserId?: string;
      family?: Family;
      membership?: FamilyMember;
    }
  }
}

export {};
