"use client";

import { Hint } from "@/components/hint";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface ToolButtonProps {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  isActive?: boolean;
  isDisabled?: boolean;
  side?: "top" | "bottom" | "left" | "right";
  /** Small keyboard-shortcut hint rendered in the corner (e.g. "2"). */
  shortcut?: string;
}

export const ToolButton = ({
  icon: Icon,
  label,
  onClick,
  isActive,
  isDisabled,
  side = "right",
  shortcut,
}: ToolButtonProps) => {
  return (
    <Hint label={label} side={side} sideOffset={14}>
      <div className="relative">
        <Button
          disabled={isDisabled}
          onClick={onClick}
          size={"icon"}
          variant={isActive ? "boardActive" : "board"}
        >
          <Icon />
        </Button>
        {shortcut && (
          <span className="pointer-events-none absolute bottom-0.5 right-1 text-[9px] leading-none text-muted-foreground">
            {shortcut}
          </span>
        )}
      </div>
    </Hint>
  );
};
