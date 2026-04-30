import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { CashFlowForm } from "../_components/cashflow-form";

export const metadata = { title: "Log cash flow" };

export default async function NewCashFlowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/cash-flow");

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/cash-flow"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Cash flow
          </Link>
        }
        title="Log entry"
        description="Money in or out. Update the bank balance separately on the cash flow page."
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <CashFlowForm />
        </div>
      </div>
    </>
  );
}
