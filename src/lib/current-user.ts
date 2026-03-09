import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * getCurrentUser — centralized single-user lookup.
 * Uses findFirst with stable orderBy so result is deterministic.
 * Future: swap this to read userId from session/auth token for multi-user.
 */
export async function getCurrentUser(): Promise<User | null> {
  return prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
}
