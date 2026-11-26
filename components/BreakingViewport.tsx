"use client";

import { useState, type ReactNode } from "react";

export function BreakingViewport({ children }: { children: ReactNode }) {
  const [held, setHeld] = useState(false);
  return <div className="breaking-viewport" data-held={held || undefined}
    onTouchStart={() => setHeld(true)}
    onTouchEnd={() => setHeld(false)}
    onTouchCancel={() => setHeld(false)}>
    {children}
  </div>;
}
