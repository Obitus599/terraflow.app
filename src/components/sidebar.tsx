import Link from "next/link";

import { NavLink } from "@/components/nav-link";
import { UserMenu } from "@/components/user-menu";
import { visibleNavItems } from "@/lib/nav-items";

interface SidebarProps {
  profile: { full_name: string; email: string; role: string };
}

export function Sidebar({ profile }: SidebarProps) {
  const items = visibleNavItems(profile.role);

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-bg-2 md:flex">
      <Link
        href="/"
        className="flex h-14 items-center gap-2 border-b border-line px-4"
      >
        <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-display text-sm font-semibold text-bg">
          T
        </span>
        <span className="font-display text-sm font-medium tracking-tight text-text">
          TerraFlow Ops
        </span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </nav>

      <div className="border-t border-line p-3">
        <UserMenu profile={profile} />
      </div>
    </aside>
  );
}
