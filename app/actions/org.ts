"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";
import { requireUser, requireOrgMembership, requireOrgAdmin } from "@/lib/guards";

export async function createOrganization({ name }: { name: string }) {
  const user = await requireUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Organization name is required.");

  const org = await prisma.organization.create({
    data: {
      name: trimmed,
      slug: slugify(trimmed),
      memberships: { create: { userId: user.id, role: "OWNER" } },
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeOrgId: org.id },
  });

  revalidatePath("/dashboard");
  return org.id;
}

export async function setActiveOrg({ orgId }: { orgId: string }) {
  const { user } = await requireOrgMembership(orgId);
  await prisma.user.update({
    where: { id: user.id },
    data: { activeOrgId: orgId },
  });
  revalidatePath("/dashboard");
}

/** Creates a pending invitation and returns a shareable accept URL path. */
export async function inviteMember({
  orgId,
  email,
  role = "MEMBER",
}: {
  orgId: string;
  email: string;
  role?: "ADMIN" | "MEMBER";
}) {
  await requireOrgAdmin(orgId);

  const normalized = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error("Enter a valid email address.");
  }

  const token = nanoid(32);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.invitation.create({
    data: { orgId, email: normalized, role, token, expiresAt },
  });

  // Email delivery is out of scope; caller shows this link to copy/share.
  return `/invite/${token}`;
}

export async function acceptInvitation({ token }: { token: string }) {
  const user = await requireUser();

  const invite = await prisma.invitation.findUnique({ where: { token } });
  if (!invite) throw new Error("Invitation not found or already used.");
  if (invite.expiresAt < new Date()) {
    await prisma.invitation.delete({ where: { token } }).catch(() => {});
    throw new Error("This invitation has expired.");
  }

  await prisma.membership.upsert({
    where: { userId_orgId: { userId: user.id, orgId: invite.orgId } },
    create: { userId: user.id, orgId: invite.orgId, role: invite.role },
    update: {},
  });

  await prisma.user.update({
    where: { id: user.id },
    data: { activeOrgId: invite.orgId },
  });

  await prisma.invitation.delete({ where: { token } }).catch(() => {});

  revalidatePath("/dashboard");
  return invite.orgId;
}
