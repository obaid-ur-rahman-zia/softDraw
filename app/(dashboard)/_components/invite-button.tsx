"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { inviteMember } from "@/app/actions/org";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useOrg } from "@/providers/org-provider";

export const InviteButton = () => {
  const { activeOrgId } = useOrg();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const { mutate, pending } = useApiMutation(inviteMember);

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrgId) return;
    mutate({ orgId: activeOrgId, email, role })
      .then((path) => {
        setInviteUrl(`${window.location.origin}${path}`);
        toast.success("Invitation link created");
      })
      .catch((err) => toast.error(err?.message ?? "Failed to create invite"));
  };

  const copy = () => {
    if (!inviteUrl) return;
    navigator.clipboard.writeText(inviteUrl);
    toast.success("Link copied");
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          setInviteUrl(null);
          setEmail("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant={"outline"}>
          <Plus className="h-4 w-4 mr-2" />
          Invite members
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite members</DialogTitle>
          <DialogDescription>
            Create a link to invite people to collaborate in this team.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onInvite} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select
              value={role}
              onValueChange={(v) => setRole(v as "MEMBER" | "ADMIN")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={pending || !email}>
            {pending ? "Creating…" : "Create invite link"}
          </Button>
        </form>

        {inviteUrl && (
          <div className="mt-2 space-y-2">
            <Label>Share this link</Label>
            <div className="flex gap-x-2">
              <Input readOnly value={inviteUrl} onFocus={(e) => e.target.select()} />
              <Button type="button" variant="outline" onClick={copy}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
