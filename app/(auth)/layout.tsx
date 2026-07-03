import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { APP } from "@/lib/constants";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <Link href="/" className="flex items-center gap-x-2">
        <Image src="/logo.svg" alt={APP.APP_NAME} width={40} height={40} />
        <span className="text-2xl font-semibold">{APP.APP_NAME}</span>
      </Link>
      {children}
    </div>
  );
}
