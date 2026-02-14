"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  MapPin,
  Plus,
  Users,
  Sparkles,
  CheckCircle,
  MessageCircle,
  Navigation,
} from "lucide-react";
import { post } from "@/lib/api";
import { isDemo } from "@/lib/config";
import { demoCreateTripGroup } from "@/lib/demo/demo-client-service";
import { Button } from "@/components/ui/Button";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { FeatureCard } from "@/components/landing/FeatureCard";
import { StepCard } from "@/components/landing/StepCard";
import type { DepartureType } from "@/types";

export default function TopPage() {
  const router = useRouter();
  const [groupName, setGroupName] = useState("");
  const [departure, setDeparture] = useState("");
  const [departureType, setDepartureType] = useState<DepartureType>("text");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [suggestion, setSuggestion] = useState<{ value: string; label: string; type: DepartureType } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationAttempted, setLocationAttempted] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // マウント時に位置情報を自動推測（候補として保持）
  useEffect(() => {
    if (locationAttempted) return;
    if (!navigator.geolocation) return;
    setLocationAttempted(true);
    setIsLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        // Nominatim地名フォールバック
        const setFallback = (address: Record<string, string> | null, displayName: string | null) => {
          const city = address?.city || address?.town || address?.village || address?.suburb || "";
          const state = address?.state || address?.province || "";
          const locationName = [city, state].filter(Boolean).join(", ");
          setSuggestion({
            value: locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            label: displayName || locationName || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            type: "geolocation",
          });
        };

        try {
          // 1. Nominatim で郵便番号を取得
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=ja`,
            { headers: { "User-Agent": "TripVote-App" } }
          );
          const data = await response.json();
          const address = data.address;
          const postalCode = (address?.postcode || "").replace("-", "");

          if (postalCode) {
            // 2. zipcloud で住所変換
            try {
              const zipRes = await fetch(
                `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${postalCode}`
              );
              const zipData = await zipRes.json();
              const result = zipData.results?.[0];
              if (result) {
                const fullAddress = `${result.address1}${result.address2}${result.address3}`;
                setSuggestion({ value: fullAddress, label: fullAddress, type: "geolocation" });
              } else {
                setFallback(address, data.display_name);
              }
            } catch {
              setFallback(address, data.display_name);
            }
          } else {
            setFallback(address, data.display_name);
          }
        } catch (err) {
          console.error("逆ジオコーディング失敗:", err);
          setSuggestion({
            value: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            label: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            type: "geolocation",
          });
        } finally {
          setIsLoadingLocation(false);
        }
      },
      () => {
        setIsLoadingLocation(false);
      }
    );
  }, [locationAttempted]);

  const handleSelectSuggestion = () => {
    if (!suggestion) return;
    setDeparture(suggestion.value);
    setDepartureType(suggestion.type);
  };

  const showSuggestion = isFocused && suggestion && !departure;

  const handleSubmit = async () => {
    const trimmedName = groupName.trim();
    const trimmedDeparture = departure.trim();

    if (!trimmedName) {
      setError("グループ名を入力してください");
      return;
    }

    if (!trimmedDeparture) {
      setError("出発地点を入力してください");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isDemo()) {
        const group = await demoCreateTripGroup(trimmedName, {
          departure_type: departureType,
          departure_value: trimmedDeparture,
          departure_raw: trimmedDeparture,
        });
        router.push(`/trip-groups/${group.trip_group_id}/invite`);
      } else {
        const data = await post<{ tripGroup: { trip_group_id: string } }>(
          "/api/trip-groups",
          {
            name: trimmedName,
            departure_type: departureType,
            departure_value: trimmedDeparture,
            departure_raw: trimmedDeparture,
          }
        );
        router.push(`/trip-groups/${data.tripGroup.trip_group_id}/invite`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "グループの作成に失敗しました");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen max-w-[430px] bg-surface shadow-lg">
      <div className="mx-auto max-w-[395px] flex flex-col gap-6 px-6 pt-12 pb-12">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-3xl bg-primary">
            <MapPin className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-[32px] font-bold text-foreground text-center">
            つぎココ
          </h1>
          <p className="text-lg text-text-secondary text-center leading-[1.5] whitespace-pre-line">
            {"グループ旅行の行き先を\nみんなで決めよう"}
          </p>
        </div>

        {/* Form Card */}
        <div className="flex flex-col gap-4 rounded-[20px] bg-white p-5 border border-border">
          <div className="flex flex-col gap-2">
            <SectionLabel>
              グループ名 <span className="text-red-500">*</span>
            </SectionLabel>
            <input
              type="text"
              placeholder="例：沖縄旅行"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              className="w-full h-12 rounded-xl bg-surface px-4 text-[15px] text-foreground placeholder:text-text-muted outline-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <SectionLabel>
              出発地点 <span className="text-red-500">*</span>
            </SectionLabel>
            <div className="relative">
              <input
                type="text"
                placeholder="例：東京駅、渋谷区"
                value={departure}
                onChange={(e) => {
                  setDeparture(e.target.value);
                  setDepartureType("text");
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setTimeout(() => setIsFocused(false), 150)}
                className="w-full h-12 rounded-xl bg-surface px-4 text-[15px] text-foreground placeholder:text-text-muted outline-none"
              />
              {isLoadingLocation && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
              {showSuggestion && (
                <button
                  type="button"
                  onClick={handleSelectSuggestion}
                  className="absolute left-0 right-0 top-full mt-1 z-10 flex items-center gap-2.5 rounded-xl bg-white border border-border p-3 shadow-lg text-left hover:bg-surface transition"
                >
                  <Navigation className="h-4 w-4 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">現在地から設定</p>
                    <p className="text-xs text-text-muted truncate">{suggestion.label}</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Create Button */}
        <Button
          size="lg"
          icon={<Plus className="h-5 w-5" />}
          isLoading={isSubmitting}
          loadingText="作成中..."
          disabled={!groupName.trim() || !departure.trim()}
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
