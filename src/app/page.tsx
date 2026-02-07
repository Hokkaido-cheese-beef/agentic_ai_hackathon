"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Users,
  Sparkles,
  CheckCircle,
  MessageCircle,
} from "lucide-react";
import { post } from "@/lib/api";
import { isDemo } from "@/lib/config";
import { demoCreateTripGroup } from "@/lib/demo/demo-client-service";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { StepCard } from "@/components/landing/StepCard";

export default function TopPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [departure, setDeparture] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError("位置情報を取得できませんでした");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDeparture(`${pos.coords.latitude},${pos.coords.longitude}`);
      },
      () => {
        setError("位置情報を取得できませんでした");
      }
    );
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isDemo()) {
        const group = await demoCreateTripGroup(groupName.trim());
        router.push(`/trip-groups/${group.trip_group_id}`);
      } else {
        const data = await post<{ tripGroup: { trip_group_id: string } }>(
          "/api/trip-groups",
          {
            name: groupName.trim(),
            departure: departure.trim() || null,
            status: "draft",
          }
        );
        router.push(`/trip-groups/${data.tripGroup.trip_group_id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "グループの作成に失敗しました");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-surface">
      <div className="mx-auto max-w-[395px] flex flex-col gap-6 px-6 pt-12 pb-12">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-3xl bg-primary">
            <MapPin className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-[32px] font-bold text-foreground text-center">
            TripVote
          </h1>
          <p className="text-lg text-text-secondary text-center leading-[1.5] whitespace-pre-line">
            {"グループ旅行の行き先を\nみんなで決めよう"}
          </p>
        </div>

        {/* Form Card */}
        <div className="flex flex-col gap-4 rounded-[20px] bg-white p-5 border border-border">
          <div className="flex flex-col gap-2">
            <SectionLabel>グループ名</SectionLabel>
            <input
              type="text"
              placeholder="例：沖縄旅行 2026"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="h-12 rounded-xl bg-surface px-4 text-[15px] text-foreground placeholder:text-text-muted outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <SectionLabel>出発地点（任意）</SectionLabel>
            <button
              type="button"
              onClick={handleGetLocation}
              className="flex h-12 items-center gap-2 rounded-xl bg-surface px-4"
            >
              <MapPin className="h-[18px] w-[18px] text-text-secondary" />
              <span className="text-[15px] text-text-secondary">
                {departure || "現在地を取得"}
              </span>
            </button>
          </div>
        </div>

        {/* Create Button */}
        <Button
          size="lg"
          icon={<Plus className="h-5 w-5" />}
          isLoading={isSubmitting}
          loadingText="作成中..."
          disabled={!groupName.trim()}
          onClick={handleSubmit}
          className="w-full rounded-2xl"
        >
          グループを作成する
        </Button>

        {/* Error */}
        <ErrorMessage message={error} centered />

        {/* Feature Cards */}
        <div className="flex justify-center gap-3">
          <FeatureCard icon={<Users className="h-6 w-6 text-primary" />} label={"グループ\n共有"} />
          <FeatureCard icon={<Sparkles className="h-6 w-6 text-primary" />} label={"AI要約\n比較"} />
          <FeatureCard icon={<CheckCircle className="h-6 w-6 text-primary" />} label={"納得\n決定"} />
        </div>

        {/* How To Section */}
        <div className="flex flex-col gap-6 pt-8">
          <div className="flex flex-col items-center gap-3">
            <span className="text-xs font-semibold text-primary tracking-[0.2em]">
              HOW TO USE
            </span>
            <h2 className="text-[22px] font-bold text-foreground text-center leading-[1.3] whitespace-pre-line">
              {"3ステップで\n簡単に行き先決定"}
            </h2>
          </div>

          <div className="flex flex-col gap-4">
            <StepCard
              num={1}
              icon={<Users className="h-5 w-5 text-primary" />}
              title="グループを作成"
              desc="リンクを共有するだけで参加OK"
            />
            <StepCard
              num={2}
              icon={<MessageCircle className="h-5 w-5 text-primary" />}
              title="知りたいことを質問"
              desc="目的地について自由に質問できます"
            />
            <StepCard
              num={3}
              icon={<Sparkles className="h-5 w-5 text-primary" />}
              title="AIが情報を比較・整理"
              desc="比較しやすく整理して行き先決定！"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
