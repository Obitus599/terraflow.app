import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { DealForm } from "../_components/deal-form";

export const metadata = { title: "New deal" };

export default async function NewDealPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .order("full_name");

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Pipeline
          </Link>
        }
        title="New deal"
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <DealForm
            mode="create"
            owners={profiles ?? []}
            initial={{ owner_id: user!.id }}
            canDelete={false}
          />
        </div>
      </div>
    </>
  );
}
