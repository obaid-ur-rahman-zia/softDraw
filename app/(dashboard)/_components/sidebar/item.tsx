"use client";

import { Hint } from "@/components/hint";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { useOrg } from "@/providers/org-provider";

interface ItemProps {
  id: string;
  name: string;
  imageUrl: string | null;
}

const Item = ({ id, name, imageUrl }: ItemProps) => {
  const { activeOrgId, switchOrg } = useOrg();
  const isActive = activeOrgId === id;

  return (
    <div className="aspect-square relative">
      <Hint label={name} side="right" align="start" sideOffset={18}>
        <button
          onClick={() => switchOrg(id)}
          className={cn(
            "relative h-full w-full rounded-md overflow-hidden opacity-75 hover:opacity-100 transition",
            isActive && "opacity-100 ring-2 ring-white"
          )}
        >
          {imageUrl ? (
            <Image alt={name} src={imageUrl} fill className="object-cover" />
          ) : (
            <div className="h-full w-full bg-white/25 flex items-center justify-center text-white font-semibold">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
        </button>
      </Hint>
    </div>
  );
};

export default Item;
