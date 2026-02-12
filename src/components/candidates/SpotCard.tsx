import Image from "next/image";
import { Info } from "lucide-react";
import { Tag } from "@/components/ui/Tag";
import { AiSummaryCard } from "./AiSummaryCard";
import type { TripCandidate } from "@/types";

type SpotCardProps = {
  candidate: TripCandidate;
};

export function SpotCard({ candidate }: SpotCardProps) {
  return (
    <div className="overflow-hidden [border-radius:var(--card-radius-default)] bg-white border border-border shadow-[0_4px_20px_#0000000D]">
      {/* Photo Area */}
      <div className="relative h-[200px] overflow-hidden">
        {candidate.image_url ? (
          <Image
            src={candidate.image_url}
            alt={candidate.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-primary to-[#60A5FA]" />
        )}
        {candidate.rating != null && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/40 px-2.5 py-1">
            <span className="text-sm font-bold text-rating">
              ★ {candidate.rating}
            </span>
            {candidate.review_count != null && (
              <span className="text-[11px] text-white">
                ({candidate.review_count})
              </span>
            )}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-t from-white to-transparent" />
      </div>

      {/* Card Body */}
      <div className="flex flex-col gap-3 p-4">
        <h3 className="text-xl font-bold text-foreground">{candidate.name}</h3>

        {candidate.description && (
          <p className="text-sm text-text-secondary leading-[1.4]">
            {candidate.description}
          </p>
        )}

        {/* Tags */}
        {candidate.tags && candidate.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidate.tags.map((tag, i) => (
              <Tag
                key={i}
                icon={tag.icon}
                label={tag.label}
                textColor={tag.textColor}
                iconColor={tag.iconColor}
                bgColor={tag.bgColor}
              />
            ))}
          </div>
        )}

        {/* Info */}
        {candidate.info && (
          <div className="flex flex-col gap-1.5 [border-radius:var(--card-radius-inner)] bg-surface p-3">
            <div className="flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5 text-text-secondary" />
              <span className="text-xs font-semibold text-text-secondary">基本情報</span>
            </div>
            <p className="text-sm text-text-dark leading-[1.6]">{candidate.info}</p>
          </div>
        )}

        {/* AI Summary */}
        {candidate.ai_summary && (
          <AiSummaryCard aiSummary={candidate.ai_summary} />
        )}
      </div>
    </div>
  );
}
