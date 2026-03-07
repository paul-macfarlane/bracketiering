"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, User, Settings, LogOut } from "lucide-react";
import {
  ThemeToggleDropdown,
  ThemeToggleMobile,
} from "@/components/theme-toggle";

import { authClient } from "@/lib/auth/client";
import type { Session } from "@/lib/auth";
import { getInitials } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

interface AppHeaderProps {
  session: Session;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/pools", label: "Pools" },
] as const;

export function AppHeader({ session }: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  const user = session.user;
  const initials = getInitials(user.name);

  return (
    <header className="border-b">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: logo + nav links */}
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-lg font-bold">
            BRacketiering
          </Link>
          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm transition-colors hover:text-foreground ${isActive ? "font-medium text-foreground" : "text-muted-foreground"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: user menu (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-2">
          {/* Desktop user dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="hidden gap-2 md:inline-flex">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user.image ?? undefined} alt={user.name} />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link
                  href="/profile"
                  className={`cursor-pointer ${pathname === "/profile" ? "font-medium" : ""}`}
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/settings"
                  className={`cursor-pointer ${pathname === "/settings" ? "font-medium" : ""}`}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <ThemeToggleDropdown />
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="cursor-pointer"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile hamburger menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-4 pt-4">
                {/* User info */}
                <div className="flex items-center gap-3 px-1">
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src={user.image ?? undefined}
                      alt={user.name}
                    />
                    <AvatarFallback className="text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Nav links */}
                <nav className="flex flex-col gap-1">
                  {navLinks.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      pathname.startsWith(link.href + "/");
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className={`rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${isActive ? "bg-accent font-medium" : ""}`}
                      >
                        {link.label}
                      </Link>
                    );
                  })}
                </nav>

                <Separator />

                {/* User actions */}
                <nav className="flex flex-col gap-1">
                  <Link
                    href="/profile"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${pathname === "/profile" ? "bg-accent font-medium" : ""}`}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${pathname === "/settings" ? "bg-accent font-medium" : ""}`}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </nav>

                <Separator />

                <ThemeToggleMobile />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
