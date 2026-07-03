import { AuthForm } from "@/components/auth/auth-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const googleEnabled = !!(
    process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET
  );
  return (
    <AuthForm
      mode="sign-in"
      googleEnabled={googleEnabled}
      callbackUrl={callbackUrl}
    />
  );
}
