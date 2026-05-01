import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { StageEditor } from "./_components/stage-editor";

export const metadata = { title: "Edit funnel" };

export default async function EditFunnelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: funnel }, { data: stages }] = await Promise.all([
    supabase
      .from("funnels")
      .select("id, name, description, channel, archived")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("funnel_stages")
      .select(
        "id, name, sort_order, target_conversion_pct, target_days, is_terminal_won, is_terminal_lost",
      )
      .eq("funnel_id", id)
      .order("sort_order"),
  ]);

  if (!funnel) notFound();

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href={`/funnels/${id}`}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            {funnel.name}
          </Link>
        }
        title="Edit stages"
        description="Drag the handle to reorder stages. Set conversion targets to compare against actual performance on the analytics page."
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-4xl">
          <StageEditor
            funnelId={funnel.id}
            initial={(stages ?? []).map((s) => ({
              id: s.id,
              name: s.name,
              sort_order: s.sort_order,
              target_conversion_pct: s.target_conversion_pct,
              target_days: s.target_days,
              is_terminal_won: s.is_terminal_won,
              is_terminal_lost: s.is_terminal_lost,
            }))}
          />
        </div>
      </div>
    </>
  );
}
