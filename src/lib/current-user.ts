import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/**
 * Local User type — minimal shape returned by getCurrentUser.
 * Mirrors the Prisma User model fields consumed by callers.
 */
export interface User {
  id: string;
  username: string;
  level: number;
  exp: number;
  streak: number;
  lastCheckIn: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * getCurrentUser — centralized single-user lookup.
 * Uses findFirst with stable orderBy so result is deterministic.
 * Future: swap this to read userId from session/auth token for multi-user.
 */
export async function getCurrentUser(): Promise<User | null>;
export async function getCurrentUser<T extends Prisma.UserSelect>(
  select: T
): Promise<Prisma.UserGetPayload<{ select: T }> | null>;
export async function getCurrentUser<T extends Prisma.UserSelect>(
  select?: T
): Promise<User | Prisma.UserGetPayload<{ select: T }> | null> {
  if (select) {
    return prisma.user.findFirst({
      orderBy: { createdAt: "asc" },
      select,
    });
  }

  return prisma.user.findFirst({ orderBy: { createdAt: "asc" } }) as unknown as User | null;
}
