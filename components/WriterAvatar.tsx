"use client";

import { writerProfilePhoto } from "@/lib/writerPhoto";
import Image from "next/image";
import { useState } from "react";

export function WriterAvatar({ name, source, size = 52, allowBrandLogo = false }: { name: string; source?: string | null; size?: number; allowBrandLogo?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  const photo = allowBrandLogo ? source : writerProfilePhoto(source);
  if (!photo || failed) {
    return <span className="writer-monogram" style={{ width: size, height: size, fontSize: size * .36 }} aria-hidden="true">{initials}</span>;
  }
  return <Image className="directory-avatar" alt={name} src={photo} width={size} height={size}
    unoptimized={/^https?:/i.test(photo) && !/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(photo)} onError={() => setFailed(true)} />;
}
