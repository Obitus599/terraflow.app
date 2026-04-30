import {
  Building2,
  CheckSquare,
  GitFork,
  LayoutDashboard,
  Mail,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
  comingSoon?: boolean;
}

const ALL_ITEMS: NavItem[] = [
  { href: "/", label: "Home", icon: LayoutDashboard, exact: true },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/pipeline", label: "Pipeline", icon: GitFork },
  { href: "/clients", label: "Clients", icon: Building2 },
  { href: "/revenue", label: "Revenue", icon: TrendingUp },
  { href: "/cash-flow", label: "Cash flow", icon: Wallet },
  { href: "/cold-email", label: "Cold email", icon: Mail },
  { href: "/team", label: "Team", icon: Users, comingSoon: true },
  { href: "/goals", label: "Goals", icon: Target, comingSoon: true },
  { href: "/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export function visibleNavItems(role: string): NavItem[] {
  return ALL_ITEMS.filter((item) => {
    if (item.comingSoon) return false;
    if (item.adminOnly && role !== "admin") return false;
    return true;
  });
}
