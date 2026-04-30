import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";

import { AuditLogTable } from "./_components/audit-log-table";
import { TeamRow } from "./_components/team-row";
import { ThresholdsForm } from "./_components/thresholds-form";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profile }, { data: settings }, { data: profiles }, { data: audit }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle(),
      supabase.from("app_settings").select("*").limit(1).maybeSingle(),
      supabase
        .from("profiles")
        .select(
          "id, email, full_name, role, monthly_capacity_hours, fixed_monthly_cost_aed",
        )
        .order("role", { ascending: false })
        .order("full_name"),
      supabase
        .from("audit_log")
        .select("id, table_name, record_id, action, actor_id, created_at")
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

  if (profile?.role !== "admin") redirect("/");

  const initial = settings
    ? {
        mrr_target_aed: settings.mrr_target_aed,
        mrr_target_month: settings.mrr_target_month,
        min_cash_alarm_aed: settings.min_cash_alarm_aed,
        max_bounce_rate: settings.max_bounce_rate,
        min_raj_completion_pct: settings.min_raj_completion_pct,
        owner_draw_pct: settings.owner_draw_pct,
        ashish_split_pct: settings.ashish_split_pct,
        morty_commission_pct: settings.morty_commission_pct,
      }
    : {
        mrr_target_aed: 15000,
        mrr_target_month: "2026-10-31",
        min_cash_alarm_aed: 10000,
        max_bounce_rate: 0.05,
        min_raj_completion_pct: 0.5,
        owner_draw_pct: 0.4,
        ashish_split_pct: 0.4,
        morty_commission_pct: 0.1,
      };

  const actorsById = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  return (
    <>
      <PageHeader
        eyebrow="Admin"
        title="Settings"
        description="Edit alarm thresholds, team capacities and roles, and review the audit log."
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <Tabs defaultValue="thresholds">
          <TabsList>
            <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
            <TabsTrigger value="team">Team · {profiles?.length ?? 0}</TabsTrigger>
            <TabsTrigger value="audit">Audit log</TabsTrigger>
          </TabsList>

          <TabsContent value="thresholds" className="mt-6">
            <div className="max-w-3xl">
              <ThresholdsForm initial={initial} />
            </div>
          </TabsContent>

          <TabsContent value="team" className="mt-6">
            <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-line hover:bg-transparent">
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="text-right">Capacity</TableHead>
                    <TableHead className="text-right">Fixed cost</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(profiles ?? []).map((member) => (
                    <TeamRow key={member.id} member={member} />
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="mt-6">
            <p className="mb-4 text-sm text-text-3">
              Last 100 changes across the app. Triggers fire on insert, update,
              and delete for clients, tasks, deals, revenue, bank balance, and
              app settings.
            </p>
            <AuditLogTable entries={audit ?? []} actorsById={actorsById} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
