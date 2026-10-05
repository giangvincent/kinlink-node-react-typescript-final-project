import { prisma } from "../config/database.js";
import type { PrismaClient } from "../../generated/prisma/client.js";

/**
 * A Prisma client OR a transaction handle.
 *
 * Threaded through the model functions so a service can compose several writes in
 * one transaction without the model layer knowing who is coordinating. A
 * transaction handle is a PrismaClient without the connection/transaction
 * lifecycle methods, so this Omit is the shape both satisfy.
 */
export type Db = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends" | "$use"
>;

/**
 * Run several model calls as one unit.
 *
 * This lives in the model layer, not the services, so a service can describe
 * *what* must happen atomically without ever importing Prisma. Model layer owns
 * how we talk to the database; services own what the business requires.
 */
export function transact<T>(work: (tx: Db) => Promise<T>): Promise<T> {
  return prisma.$transaction(work);
}
