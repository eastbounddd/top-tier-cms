"use client";

import Image from "next/image";
import { useState } from "react";

export function SchoolBeatAvatar({ src, handle, abbreviation }: {
  src?: string; handle?: string; abbreviation: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || !handle || failed) {
    return <span className="school-badge badge-42" aria-hidden="true">{abbreviation}</span>;
  }

  return <Image src={src} alt={`@${handle} profile picture`} className="beat-avatar"
    width={42} height={42} loading="lazy" unoptimized onError={() => setFailed(true)} />;
}
