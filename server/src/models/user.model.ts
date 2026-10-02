import { prisma } from "../config/database.js";
import type { User as PrismaUser } from "../../generated/prisma/client.js";

export type User = PrismaUser;
