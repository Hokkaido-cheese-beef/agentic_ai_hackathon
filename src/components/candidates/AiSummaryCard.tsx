import { Sparkles } from "lucide-react";
import type { AiSummary } from "@/types";

type AiSummaryCardProps = {
  aiSummary: AiSummary;
};

export function AiSummaryCard({ aiSummary }: AiSummaryCardProps) {
  return (
    <div className="flex flex-col gap-2.5 [border-radius:var(--card-radius-default)] bg-[#FFFBEB] p-3.5 border border-[#FDE68A]">
      <div className="flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-[#92400E]" />
        <span className="text-sm font-bold text-[#92400E]">AI分析</span>
      </div>
      <div className="flex flex-col gap-2">
        {aiSummary.qa.map((item, i) => (
          <div key={i} className="flex flex-col gap-1 [border-radius:var(--card-radius-small)] bg-[#FEF3C7] p-2.5">
            <span className="text-xs font-semibold text-text-secondary">Q: {item.q}</span>
            <span className="text-xs text-text-body">A: {item.a}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
