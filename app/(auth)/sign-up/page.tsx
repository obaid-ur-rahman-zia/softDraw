import { AuthForm } from "@/components/auth/auth-form";

export default async function SignUpPage({
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
      mode="sign-up"
      googleEnabled={googleEnabled}
      callbackUrl={callbackUrl}
    />
  );
}
