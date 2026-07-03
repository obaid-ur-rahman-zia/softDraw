"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createOrganization } from "@/app/actions/org";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CreateOrgDialogProps {
  children?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateOrgDialog({
  children,
  open,
  onOpenChange,
}: CreateOrgDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const actualOpen = isControlled ? open : internalOpen;
  const setOpen = (o: boolean) =>
    isControlled ? onOpenChange?.(o) : setInternalOpen(o);

  const [name, setName] = useState("");
  const { mutate, pending } = useApiMutation(createOrganization);
  const router = useRouter();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate({ name })
      .then(() => {
        toast.success("Team created!");
        setName("");
        setOpen(false);
        router.refresh();
      })
      .catch((err) =>
        toast.error(err?.message ?? "Failed to create team")
      );
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a team</DialogTitle>
          <DialogDescription>
            Teams keep your whiteboards and members together.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Team name</Label>
            <Input
              id="org-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Acme Inc."
              maxLength={60}
              required
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? "Creating…" : "Create team"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
