"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { demoCreateTripGroup } from "@/lib/demo/demo-client-service";
import type { DepartureType } from "@/types";

export function DemoCreatePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [departureValue, setDepartureValue] = useState("");
  const [departureType, setDepartureType] = useState<DepartureType>("text");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetCurrentLocation = async () => {
    setIsLoadingLocation(true);
    setError(null);

    // デモモード: モック値を使用（API呼び出しなし）
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // モック郵便番号（渋谷）
    setDepartureValue("150-0001");
    setDepartureType("postal_code");
    setIsLoadingLocation(false);
  };

  const handleClearDeparture = () => {
    setDepartureValue("");
    setDepartureType("text");
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const trimmedName = name.trim();
    const trimmedDeparture = departureValue.trim();

    if (!trimmedName) {
      setError("グループ名を入力してください");
      return;
    }

    if (!trimmedDeparture) {
      setError("出発地点を入力してください");
      return;
    }

    setIsSubmitting(true);

    demoCreateTripGroup(trimmedName, {
      departure_type: departureType,
      departure_value: trimmedDeparture,
      departure_raw: trimmedDeparture,
    })
      .then((group) => {
        router.push(`/trip-groups/${group.trip_group_id}/invite`);
      })
      .catch((err) => {
        setError(
          err instanceof Error ? err.message : "グループ作成に失敗しました"
        );
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-[430px] flex-col items-center justify-center gap-8 bg-white px-4 text-center shadow-lg">
      <div>
        <p className="text-sm text-zinc-500">グループ管理</p>
        <h1 className="text-3xl font-semibold text-zinc-900">新しいグループを作成</h1>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-md flex-col items-stretch gap-6 text-left"
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-600" htmlFor="group-name">
            グループ名
          </label>
          <input
            id="group-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-lg border border-zinc-200 px-4 py-3 text-base text-zinc-900 shadow-sm focus:border-black focus:outline-none"
            placeholder="例: 北海道チーズ旅"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-zinc-600" htmlFor="departure">
            出発地点 <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <input
              id="departure"
              type="text"
              value={departureValue}
              onChange={(event) => {
                setDepartureValue(event.target.value);
                setDepartureType("text");
              }}
              placeholder="地名または郵便番号を入力"
              className="flex-1 rounded-lg border border-zinc-200 px-4 py-3 text-base text-zinc-900 shadow-sm focus:border-black focus:outline-none"
            />
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLoadingLocation}
              className="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoadingLocation ? "取得中..." : "現在地"}
            </button>
            {departureValue && (
              <button
                type="button"
                onClick={handleClearDeparture}
                className="rounded-lg bg-zinc-100 px-4 py-3 text-sm font-medium text-zinc-900 transition hover:bg-zinc-200"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="rounded-full bg-black px-6 py-3 text-base font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || !name.trim() || !departureValue.trim()}
        >
          {isSubmitting ? "作成中..." : "作成"}
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <Link href="/" className="text-sm font-semibold text-black underline">
        トップに戻る
      </Link>
    </main>
  );
}
