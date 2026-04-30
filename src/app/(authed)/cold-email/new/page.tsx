import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";

import { ColdEmailForm } from "../_components/cold-email-form";

export const metadata = { title: "Add prospect" };

export default function NewProspectPage() {
  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/cold-email"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Cold email
          </Link>
        }
        title="Add prospect"
        description="Adds a row in the not-yet-sent state. Tick the Sent box on the list to stamp the send date."
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <ColdEmailForm />
        </div>
      </div>
    </>
  );
}
