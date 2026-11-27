"use client";

import Image from "next/image";
import { useState } from "react";

export function WriterAvatar({ name, source, size = 52 }: { name: string; source?: string | null; size?: number }) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  if (!source || failed || /(?:top-tier-logo|social-default|\/placeholder)/i.test(source)) {
    return <span className="writer-monogram" style={{ width: size, height: size, fontSize: size * .36 }} aria-hidden="true">{initials}</span>;
  }
  return <Image className="directory-avatar" alt={name} src={source} width={size} height={size}
    unoptimized={/^https?:/i.test(source) && !/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(source)} onError={() => setFailed(true)} />;
}
