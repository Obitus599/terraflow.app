import { PageHeader } from "@/components/page-header";
import { initialsOf } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Team" };

export default async function TeamPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: tasks }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, email, full_name, role, monthly_capacity_hours, fixed_monthly_cost_aed",
      )
      .order("role", { ascending: false })
      .order("full_name"),
    supabase
      .from("tasks")
      .select("owner_id, status, estimated_hours")
      .neq("status", "done"),
  ]);

  const allocByOwner = new Map<string, number>();
  for (const t of tasks ?? []) {
    const cur = allocByOwner.get(t.owner_id) ?? 0;
    allocByOwner.set(t.owner_id, cur + Number(t.estimated_hours ?? 0));
  }

  const totalCapacity = (profiles ?? []).reduce(
    (s, p) => s + p.monthly_capacity_hours,
    0,
  );
  const totalAllocated = Array.from(allocByOwner.values()).reduce(
    (s, v) => s + v,
    0,
  );
  const totalFixedCost = (profiles ?? []).reduce(
    (s, p) => s + p.fixed_monthly_cost_aed,
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Team"
        title="Capacity"
        description={`${profiles?.length ?? 0} people · ${totalAllocated.toFixed(1)}h allocated of ${totalCapacity}h capacity · AED ${totalFixedCost.toLocaleString("en-AE")}/mo fixed`}
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(profiles ?? []).map((p) => {
            const allocated = allocByOwner.get(p.id) ?? 0;
            const capacity = p.monthly_capacity_hours;
            const utilization =
              capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
            const tone =
              capacity === 0
                ? "muted"
                : utilization > 100
                  ? "danger"
                  : utilization > 85
                    ? "warning"
                    : "ok";

            return (
              <div
                key={p.id}
                className="rounded-xl border border-line bg-bg-2 p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-bg-3 text-sm text-text-2">
                      {initialsOf(p.full_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-display text-base text-text">
                        {p.full_name}
                      </p>
                      <p className="truncate text-xs text-text-3">{p.email}</p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-line bg-bg-3 px-2.5 py-0.5 text-[11px] uppercase tracking-[0.18em] text-text-3">
                    {p.role}
                  </span>
                </div>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-text-3">
                      {allocated.toFixed(1)}h
                      {capacity > 0 ? ` / ${capacity}h` : " (no capacity)"}
                    </span>
                    <span
                      className={cn(
                        "font-display text-sm",
                        tone === "danger" && "text-danger",
                        tone === "warning" && "text-warning",
                        tone === "ok" && "text-success",
                        tone === "muted" && "text-text-3",
                      )}
                    >
                      {capacity === 0 ? "—" : `${utilization}%`}
                    </span>
                  </div>
                  {capacity > 0 ? (
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-3">
                      <div
                        className={cn(
                          "h-full",
                          tone === "danger" && "bg-danger",
                          tone === "warning" && "bg-warning",
                          tone === "ok" && "bg-accent",
                          tone === "muted" && "bg-text-4",
                        )}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                  ) : null}
                </div>

                {p.fixed_monthly_cost_aed > 0 ? (
                  <p className="mt-4 text-xs text-text-3">
                    Fixed cost · AED{" "}
                    {p.fixed_monthly_cost_aed.toLocaleString("en-AE")}/mo
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
