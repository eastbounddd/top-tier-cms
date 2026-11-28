export function writerProfilePhoto(source?: string | null) {
  const url = source?.trim();
  if (!url || /(?:top-tier-logo|social-default|\/placeholder)/i.test(url)) return undefined;
  return url;
}
