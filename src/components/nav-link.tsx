"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function NavLink({ href, label, icon: Icon, exact = false }: NavLinkProps) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
        active
          ? "bg-bg-3 text-accent"
          : "text-text-2 hover:bg-bg-3 hover:text-text",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
