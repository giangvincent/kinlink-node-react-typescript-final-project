import type { RequestHandler } from "express";
import session from "express-session";
import type { SessionOptions } from "express-session";
import "dotenv/config";

const isProd = process.env.NODE_ENV === "production";

const sessionConfig: SessionOptions = {
  // Secret rotates signatures. In production this MUST be a 32-character random string
  // stored in the environment, never in source control.
  secret: process.env.SESSION_SECRET ?? "change-me-in-production",
  resave: false,                          // do not save unmodified sessions back to storage
  saveUninitialized: false,               // do not create sessions until something is stored
  proxy: isProd,                          // trust reverse proxy headers in production
  cookie: {
    httpOnly: true,                       // JavaScript cannot read the cookie
    secure: isProd,                       // send only over HTTPS in production
    sameSite: "lax",                      // CSRF-safe: allows GET from same-site navigation
    maxAge: 24 * 60 * 60 * 1000,          // 24 hours
  },
  name: "kinlink.sid",                    // custom cookie name instead of connect.sid
  rolling: true,                          // renew expiry on each request
};

export const sessionMiddleware: RequestHandler = session(sessionConfig);
