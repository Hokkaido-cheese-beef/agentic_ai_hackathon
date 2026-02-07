"use client";

import { isDemo } from "@/lib/config";
import { DemoCreatePage } from "@/components/demo/DemoCreatePage";
import { ProdCreatePage } from "@/components/prod/ProdCreatePage";

export default function TripGroupCreatePage() {
  return isDemo() ? <DemoCreatePage /> : <ProdCreatePage />;
}
