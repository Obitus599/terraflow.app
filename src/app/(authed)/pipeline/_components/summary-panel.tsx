import { formatAedCompact } from "@/lib/format";
import {
  ACTIVE_STAGES,
  CONFIDENCE_LABELS,
  PIPELINE_CONFIDENCES,
  STAGE_LABELS,
} from "@/lib/pipeline/schema";

interface SummaryPanelProps {
  deals: {
    stage: string;
    confidence: string;
    expected_aed_monthly: number;
  }[];
}

export function SummaryPanel({ deals }: SummaryPanelProps) {
  const stageRows = ACTIVE_STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage);
    return {
      stage,
      count: stageDeals.length,
      aed: stageDeals.reduce((s, d) => s + d.expected_aed_monthly, 0),
    };
  });

  const confidenceRows = PIPELINE_CONFIDENCES.map((c) => {
    const confDeals = deals.filter((d) => d.confidence === c);
    return {
      confidence: c,
      count: confDeals.length,
      aed: confDeals.reduce((s, d) => s + d.expected_aed_monthly, 0),
    };
  });

  const total = deals.reduce((s, d) => s + d.expected_aed_monthly, 0);

  return (
    <aside className="w-72 shrink-0 space-y-6 rounded-xl border border-line bg-bg-2 p-5">
      <div>
        <p className="section-label mb-3">Total open</p>
        <p className="font-display text-3xl font-medium text-text">
          {formatAedCompact(total)}
        </p>
        <p className="mt-1 text-xs text-text-3">{deals.length} deals</p>
      </div>

      <div>
        <p className="section-label mb-3">By stage</p>
        <ul className="space-y-2">
          {stageRows.map((r) => (
            <li
              key={r.stage}
              className="flex items-baseline justify-between text-sm"
            >
              <span className="text-text-2">{STAGE_LABELS[r.stage]}</span>
              <span className="text-text-3">
                {r.count} · {formatAedCompact(r.aed)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="section-label mb-3">By confidence</p>
        <ul className="space-y-2">
          {confidenceRows.map((r) => (
            <li
              key={r.confidence}
              className="flex items-baseline justify-between text-sm"
            >
              <span className="text-text-2">
                {CONFIDENCE_LABELS[r.confidence]}
              </span>
              <span className="text-text-3">
                {r.count} · {formatAedCompact(r.aed)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
