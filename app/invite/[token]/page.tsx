import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { APP } from "@/lib/constants";
import { AcceptInvite } from "./accept-invite";

interface InvitePageProps {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  const invite = await prisma.invitation.findUnique({
    where: { token },
    include: { org: true },
  });
  if (!invite) notFound();

  const expired = invite.expiresAt < new Date();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex items-center gap-x-2">
        <Image src="/logo.svg" alt={APP.APP_NAME} width={40} height={40} />
        <span className="text-2xl font-semibold">{APP.APP_NAME}</span>
      </div>

      {expired ? (
        <>
          <p className="text-muted-foreground max-w-sm">
            This invitation has expired. Ask a team admin to send you a new
            link.
          </p>
          <Button asChild variant="outline">
            <Link href="/">Go to dashboard</Link>
          </Button>
        </>
      ) : (
        <>
          <p className="text-lg">
            You&apos;ve been invited to join{" "}
            <span className="font-semibold">{invite.org.name}</span>
          </p>
          <AcceptInvite token={token} />
        </>
      )}
    </div>
  );
}
