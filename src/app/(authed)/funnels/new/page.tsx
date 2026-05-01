import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { BlankFunnelForm } from "./_components/blank-funnel-form";
import { TemplateCard } from "./_components/template-card";

export const metadata = { title: "New funnel" };

export default async function NewFunnelPage() {
  const supabase = await createClient();

  const [{ data: templates }, { data: stages }] = await Promise.all([
    supabase
      .from("funnels")
      .select("id, name, description, channel, template_slug")
      .eq("is_template", true)
      .eq("archived", false)
      .order("created_at"),
    supabase
      .from("funnel_stages")
      .select("funnel_id, name, sort_order"),
  ]);

  const stagesByFunnel = new Map<string, { name: string; sort_order: number }[]>();
  for (const s of stages ?? []) {
    const list = stagesByFunnel.get(s.funnel_id) ?? [];
    list.push({ name: s.name, sort_order: s.sort_order });
    stagesByFunnel.set(s.funnel_id, list);
  }

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/funnels"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Funnels
          </Link>
        }
        title="New funnel"
        description="Pick a template to get a battle-tested set of stages, or build your own from scratch."
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        <section>
          <p className="section-label mb-4">Templates</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(templates ?? []).map((t) => (
              <TemplateCard
                key={t.id}
                template={{
                  id: t.id,
                  name: t.name,
                  description: t.description,
                  channel: t.channel,
                  template_slug: t.template_slug,
                  stages: stagesByFunnel.get(t.id) ?? [],
                }}
              />
            ))}
          </div>
        </section>

        <section>
          <div className="max-w-xl">
            <BlankFunnelForm />
          </div>
        </section>
      </div>
    </>
  );
}
