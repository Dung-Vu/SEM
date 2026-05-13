import { prisma } from "@/lib/prisma";
import type { Prisma, User } from "@prisma/client";

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

  return prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
}
