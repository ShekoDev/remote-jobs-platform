import { Suspense } from "react";
import { JobsApp } from "@/components/JobsApp";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <Suspense fallback={<div className="pt-6"><div className="skeleton h-10 w-64" /></div>}>
      <JobsApp />
    </Suspense>
  );
}
