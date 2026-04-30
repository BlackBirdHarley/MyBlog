"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  articleId: string;
  path: string;
}

export function ViewTracker({ articleId, path }: ViewTrackerProps) {
  useEffect(() => {
    // Fire once on mount — no cookies, no local state needed
    fetch("/api/track/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        articleId,
        path,
        referrer: document.referrer || undefined,
      }),
      // Don't hold up navigation
      keepalive: true,
    }).catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
