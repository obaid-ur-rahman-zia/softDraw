"use client";

import { useState } from "react";
import { useOrg } from "@/providers/org-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CreateOrgDialog } from "./create-org-dialog";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

function OrgAvatar({
  name,
  imageUrl,
}: {
  name?: string | null;
  imageUrl?: string | null;
}) {
  return (
    <Avatar className="h-5 w-5">
      {imageUrl && <AvatarImage src={imageUrl} alt={name ?? "Team"} />}
      <AvatarFallback className="text-[10px]">
        {(name ?? "?").charAt(0).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

export function OrgSwitcher() {
  const { orgs, activeOrg, activeOrgId, switchOrg } = useOrg();
  const [createOpen, setCreateOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between">
            <span className="flex items-center gap-x-2 truncate">
              <OrgAvatar name={activeOrg?.name} imageUrl={activeOrg?.imageUrl} />
              <span className="truncate">
                {activeOrg?.name ?? "Select team"}
              </span>
            </span>
            <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[220px]">
          <DropdownMenuLabel>Teams</DropdownMenuLabel>
          {orgs.map((org) => (
            <DropdownMenuItem
              key={org.id}
              onClick={() => switchOrg(org.id)}
              className="cursor-pointer gap-x-2"
            >
              <OrgAvatar name={org.name} imageUrl={org.imageUrl} />
              <span className="truncate flex-1">{org.name}</span>
              {org.id === activeOrgId && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setCreateOpen(true);
            }}
            className="cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-2" /> Create team
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateOrgDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
