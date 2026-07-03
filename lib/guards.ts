import "server-only";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** Throws if not signed in; returns the session user. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

/** Throws unless the signed-in user is a member of `orgId`. Returns user + role. */
export async function requireOrgMembership(orgId: string) {
  const user = await requireUser();
  const membership = await prisma.membership.findUnique({
    where: { userId_orgId: { userId: user.id, orgId } },
  });
  if (!membership) throw new Error("Forbidden");
  return { user, role: membership.role };
}

/** Throws unless the user can administer `orgId` (OWNER or ADMIN). */
export async function requireOrgAdmin(orgId: string) {
  const ctx = await requireOrgMembership(orgId);
  if (ctx.role !== "OWNER" && ctx.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return ctx;
}
