"use client";

import {
  CheckSquare,
  GitFork,
  LayoutDashboard,
  LogOut,
  Menu,
  User as UserIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { signOut } from "@/lib/auth/actions";
import { visibleNavItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils";

const PRIMARY = [
  { href: "/", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/tasks", label: "Tasks", icon: CheckSquare, exact: false },
  { href: "/pipeline", label: "Pipeline", icon: GitFork, exact: false },
];

interface BottomNavProps {
  profile: { full_name: string; email: string; role: string };
}

function isActive(pathname: string, href: string, exact: boolean) {
  return exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function BottomNav({ profile }: BottomNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const allItems = visibleNavItems(profile.role);
  const overflow = allItems.filter(
    (item) => !PRIMARY.some((p) => p.href === item.href),
  );

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-bg-2 md:hidden">
      {PRIMARY.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href, item.exact);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px]",
              active ? "text-accent" : "text-text-3",
            )}
          >
            <Icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] text-text-3">
          <Menu className="h-5 w-5" />
          More
        </SheetTrigger>
        <SheetContent side="bottom" className="border-line bg-bg-2 pb-6">
          <SheetHeader className="text-left">
            <SheetTitle className="font-display text-base text-text">
              {profile.full_name}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-1 pt-4">
            {overflow.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-text-2 hover:bg-bg-3"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-md px-3 py-3 text-sm text-text-2 hover:bg-bg-3"
            >
              <UserIcon className="h-4 w-4" />
              Profile
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-md px-3 py-3 text-sm text-danger hover:bg-bg-3"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
