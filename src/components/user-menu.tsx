"use client";

import { LogOut, User as UserIcon } from "lucide-react";
import Link from "next/link";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/actions";

interface UserMenuProps {
  profile: { full_name: string; email: string; role: string };
}

export function UserMenu({ profile }: UserMenuProps) {
  const initials = profile.full_name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-bg-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-bg-3 font-display text-xs text-text-2">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-text">{profile.full_name}</p>
          <p className="truncate text-xs uppercase tracking-[0.18em] text-text-3">
            {profile.role}
          </p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top" className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center">
            <UserIcon className="mr-2 h-4 w-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => signOut()}
          className="text-danger focus:text-danger"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
