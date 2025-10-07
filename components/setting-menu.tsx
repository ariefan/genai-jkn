'use client'

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import { ChevronDownIcon, SettingsIcon } from "./icons";

type SettingMenuItem = {
  id: "instruction" | "data-peserta";
  label: string;
  disabled?: boolean;
};

const menuItems: ReadonlyArray<SettingMenuItem> = [
  { id: "instruction", label: "Instruction" },
  { id: "data-peserta", label: "Data Peserta" },
];

export type MenuItemId = SettingMenuItem["id"];

export function SettingMenu({
  className,
}: {
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleSelect = useCallback(
    (itemId: MenuItemId) => {
      switch (itemId) {
        case "instruction": {
          router.push("/instruction");
          break;
        }
        case "data-peserta": {
          router.push("/data-peserta");
          break;
        }
        default:
          break;
      }
    },
    [router],
  );

  return (
    <DropdownMenu onOpenChange={setOpen} open={open}>
      <DropdownMenuTrigger
        asChild
        className={cn(
          'w-fit data-[state=open]:bg-accent data-[state=open]:text-accent-foreground',
          className,
        )}
      >
        <Button
          className="hidden h-8 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 md:flex md:h-fit md:px-2"
          data-testid="visibility-selector"
          variant="outline"
        >
          <SettingsIcon />
          <ChevronDownIcon />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="min-w-[200px]">
        {menuItems.map((item) => (
          <DropdownMenuItem
            disabled={item.disabled ?? false}
            data-testid={`setting-menu-item-${item.id}`}
            key={item.id}
            onSelect={() => {
              setOpen(false);
              handleSelect(item.id);
            }}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
