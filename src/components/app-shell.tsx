import { BottomNav } from "@/components/bottom-nav";
import { Sidebar } from "@/components/sidebar";

interface AppShellProps {
  profile: { full_name: string; email: string; role: string };
  children: React.ReactNode;
}

export function AppShell({ profile, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        {children}
      </div>
      <BottomNav profile={profile} />
    </div>
  );
}
