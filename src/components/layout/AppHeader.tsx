"use client";

import { MapPin } from "lucide-react";

type AppHeaderProps = {
  groupName?: string;
};

export function AppHeader({ groupName }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center bg-white px-4 border-b border-border">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <span className="text-base font-bold text-foreground">
          {groupName || "つぎココ"}
        </span>
      </div>
    </header>
  );
}
