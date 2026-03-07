"use client";

import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

export function ThemeToggleDropdown() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Sun className="mr-2 h-4 w-4 dark:hidden" />
        <Moon className="mr-2 hidden h-4 w-4 dark:block" />
        Theme
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
          <DropdownMenuRadioItem value="light">
            <Sun className="mr-2 h-4 w-4" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="mr-2 h-4 w-4" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            <Monitor className="mr-2 h-4 w-4" />
            System
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

export function ThemeToggleMobile() {
  const { theme, setTheme } = useTheme();

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: Monitor },
  ] as const;

  return (
    <div className="flex flex-col gap-1">
      <span className="px-3 py-1 text-xs font-medium text-muted-foreground">
        Theme
      </span>
      <div className="flex gap-1 px-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTheme(opt.value)}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs transition-colors ${
              theme === opt.value
                ? "bg-accent text-accent-foreground"
                : "hover:bg-accent/50"
            }`}
          >
            <opt.icon className="h-3.5 w-3.5" />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
