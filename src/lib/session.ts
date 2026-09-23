import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;

  const sessionUserId = (session.user as { id?: string }).id;
  if (!sessionUserId) return null;

  // Guard against stale session cookies when database is switched or reseeded
  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        country: true,
        isActive: true,
        deletedAt: true,
      },
    });

    if (!dbUser || !dbUser.isActive || dbUser.deletedAt) {
      return null;
    }

    return dbUser;
  } catch {
    return null;
  }
}

/** Throws-free guard: returns the user only if they are an authenticated admin. */
export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || (user as { role?: string }).role !== "ADMIN") {
    return null;
  }
  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return user;
}
