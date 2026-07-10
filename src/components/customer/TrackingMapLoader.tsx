"use client";

import dynamic from "next/dynamic";

// Leaflet touches `window`/`document` at import time, so the map component
// must never be evaluated during SSR. `ssr: false` can only be used from a
// Client Component (Next.js throws a build error if attempted directly in
// a Server Component) — this file exists purely to be that boundary.
const TrackingMap = dynamic(() => import("./TrackingMap"), {
  ssr: false,
  loading: () => (
    <div className="h-96 flex items-center justify-center">
      <p className="text-text-secondary text-sm">Loading map…</p>
    </div>
  ),
});

export default TrackingMap;
