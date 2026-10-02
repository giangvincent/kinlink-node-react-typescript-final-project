import "express-session";

// express-session declares SessionData inside its own `session` namespace, so
// the merge path is the module. This is the idiom its own docs recommend.
declare module "express-session" {
  interface SessionData {
    userId?: string;
    familyId?: string;
  }
}

// It augments Request from the *global* Express namespace, so this merge path
// is different -- same file, same idea, two different places in the types.
declare global {
  namespace Express {
    interface Request {
      authenticatedUserId?: string;
      authenticatedFamilyId?: string;
    }
  }
}

// Without this the file is a script, and `declare global` is illegal in a
// script. One line, load-bearing.
export {};
