"use client";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";

export interface PaletteCommand {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  keywords?: string[];
  perform: () => void;
}

export interface PaletteGroup {
  heading: string;
  items: PaletteCommand[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: PaletteGroup[];
}

export function CommandPalette({
  open,
  onOpenChange,
  groups,
}: CommandPaletteProps) {
  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Command palette"
      description="Search menus, commands, and tools"
    >
      <CommandInput placeholder="Search menus, commands, and tools…" />
      <CommandList>
        <CommandEmpty>No matching commands.</CommandEmpty>
        {groups.map((group) =>
          group.items.length ? (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((cmd) => {
                const Icon = cmd.icon;
                return (
                  <CommandItem
                    key={cmd.id}
                    value={`${cmd.label} ${(cmd.keywords ?? []).join(" ")}`}
                    onSelect={() => {
                      onOpenChange(false);
                      cmd.perform();
                    }}
                  >
                    {Icon && <Icon className="mr-2 h-4 w-4 text-muted-foreground" />}
                    <span>{cmd.label}</span>
                    {cmd.shortcut && (
                      <CommandShortcut>{cmd.shortcut}</CommandShortcut>
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ) : null
        )}
      </CommandList>
    </CommandDialog>
  );
}
