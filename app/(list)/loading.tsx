"use client";

import { useSearchParams } from "next/navigation";
import { HomeSkeleton, PartnerSkeleton } from "@/components/skeletons";

/**
 * A loading boundary gets no props, so the URL is the only way to know which tab is coming.
 * The partner tab is its own layout, not just the mine list with different data.
 */
export default function Loading() {
  return useSearchParams().get("tab") === "theirs" ? <PartnerSkeleton /> : <HomeSkeleton />;
}
