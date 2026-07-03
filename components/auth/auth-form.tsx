"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  signUp,
  signInWithCredentials,
  signInWithGoogle,
  type AuthActionState,
} from "@/app/actions/auth";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
  googleEnabled?: boolean;
  callbackUrl?: string;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Please wait…" : label}
    </Button>
  );
}

export const AuthForm = ({ mode, googleEnabled, callbackUrl }: AuthFormProps) => {
  const isSignUp = mode === "sign-up";
  const action = isSignUp ? signUp : signInWithCredentials;
  const [state, formAction] = useActionState<AuthActionState, FormData>(
    action,
    undefined
  );

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignUp ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isSignUp
            ? "Start collaborating on whiteboards in seconds."
            : "Sign in to your SoftDraw account."}
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {callbackUrl && (
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
        )}
        {isSignUp && (
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" placeholder="Jane Doe" required />
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            required
          />
        </div>

        {state?.error && (
          <p className="text-sm text-red-500" role="alert">
            {state.error}
          </p>
        )}

        <SubmitButton label={isSignUp ? "Sign up" : "Sign in"} />
      </form>

      {googleEnabled && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>
          <form action={signInWithGoogle}>
            <Button type="submit" variant="outline" className="w-full">
              Continue with Google
            </Button>
          </form>
        </>
      )}

      <p className="text-center text-sm text-muted-foreground">
        {isSignUp ? (
          <>
            Already have an account?{" "}
            <Link href="/sign-in" className="text-foreground underline">
              Sign in
            </Link>
          </>
        ) : (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/sign-up" className="text-foreground underline">
              Sign up
            </Link>
          </>
        )}
      </p>

      <p className="text-center text-xs text-muted-foreground">
        <Link href="/" className="underline">
          Continue as guest
        </Link>{" "}
        — draw now, save after you sign in.
      </p>
    </div>
  );
};
