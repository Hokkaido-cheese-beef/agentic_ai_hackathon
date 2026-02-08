"use client";

import { useParams } from "next/navigation";
import { isDemo } from "@/lib/config";
import { DemoCandidatesPage } from "@/components/demo/DemoCandidatesPage";
import { ProdCandidatesPage } from "@/components/prod/ProdCandidatesPage";

export default function CandidatesPage() {
  const params = useParams();
  const tripGroupId = params.tripGroupId as string;
  return isDemo()
    ? <DemoCandidatesPage tripGroupId={tripGroupId} />
    : <ProdCandidatesPage tripGroupId={tripGroupId} />;
}
