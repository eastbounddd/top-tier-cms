"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

export function StoryImage({ src, ...props }: Omit<ImageProps, "src"> & { src?: string | null }) {
  const [failed, setFailed] = useState<string>();
  const image = !src || failed === src ? "/images/top-tier-logo.webp" : src;
  const unoptimized = /^https?:/i.test(image) && !/^https:\/\/(?:[^/]+\.)?supabase\.co\//i.test(image);
  return <Image {...props} src={image} unoptimized={unoptimized} onError={() => setFailed(image)} />;
}
