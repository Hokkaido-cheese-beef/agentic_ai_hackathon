"use client";

import Image from "next/image";

type AppHeaderProps = {
  groupName?: string;
};

export function AppHeader({ groupName }: AppHeaderProps) {
  return (
    <header className="flex h-14 items-center bg-white px-4 border-b border-border">
      <div className="flex items-center gap-2">
        <Image
          src="/icon.png"
          alt="つぎココ"
          width={28}
          height={28}
          className="h-7 w-7"
        />
        {groupName && (
          <span className="text-base font-bold text-foreground">
            {groupName}
          </span>
        )}
      </div>
    </header>
  );
}
