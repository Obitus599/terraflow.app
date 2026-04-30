"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  label: string;
  // Pre-rendered JSX, not a component reference. Server components can't
  // pass function values (forwardRef icons included) across the RSC
  // boundary; pre-rendering on the server side avoids that violation.
  icon: ReactNode;
  exact?: boolean;
}

export function NavLink({ href, label, icon, exact = false }: NavLinkProps) {
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
      {icon}
      {label}
    </Link>
  );
}
