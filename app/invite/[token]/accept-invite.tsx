"use client";

import { Button } from "@/components/ui/button";
import { acceptInvitation } from "@/app/actions/org";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AcceptInvite({ token }: { token: string }) {
  const { mutate, pending } = useApiMutation(acceptInvitation);
  const router = useRouter();

  const onAccept = () => {
    mutate({ token })
      .then(() => {
        toast.success("You've joined the team!");
        router.push("/dashboard");
      })
      .catch((err) => toast.error(err?.message ?? "Could not accept invite"));
  };

  return (
    <Button size="lg" disabled={pending} onClick={onAccept}>
      {pending ? "Joining…" : "Accept invitation"}
    </Button>
  );
}
