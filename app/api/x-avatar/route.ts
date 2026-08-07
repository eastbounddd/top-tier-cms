import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const revalidate = 21600;

function safeHandle(value: string | null) {
  return (value || "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30);
}

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function imageFromProfilePage(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      accept: "text/html,application/xhtml+xml",
    },
    cache: "no-store",
    redirect: "follow",
  });

  if (!response.ok) return null;
  const html = await response.text();

  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]);
  }

  return null;
}

async function fetchImage(url: string) {
  const response = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
      accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
    },
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) return null;
  const type = response.headers.get("content-type") || "";
  if (!type.startsWith("image/")) return null;

  const bytes = await response.arrayBuffer();
  if (bytes.byteLength < 500) return null;
  return { bytes, type };
}

export async function GET(request: NextRequest) {
  const handle = safeHandle(request.nextUrl.searchParams.get("handle"));
  if (!handle) {
    return Response.redirect(new URL("/top-tier-logo.png", request.url));
  }

  try {
    // First try to discover the image advertised by the actual profile page.
    for (const profileUrl of [
      `https://x.com/${handle}`,
      `https://twitter.com/${handle}`,
    ]) {
      try {
        const discovered = await imageFromProfilePage(profileUrl);
        if (discovered) {
          const image = await fetchImage(discovered);
          if (image) {
            return new Response(image.bytes, {
              headers: {
                "content-type": image.type,
                "cache-control":
                  "public, s-maxage=21600, stale-while-revalidate=86400",
              },
            });
          }
        }
      } catch {}
    }

    // If X hides metadata from server requests, use avatar resolvers server-side.
    // Doing this server-side avoids client hotlink/CORS failures.
    for (const avatarUrl of [
      `https://unavatar.io/x/${handle}`,
      `https://unavatar.io/twitter/${handle}`,
    ]) {
      try {
        const image = await fetchImage(avatarUrl);
        if (image) {
          return new Response(image.bytes, {
            headers: {
              "content-type": image.type,
              "cache-control":
                "public, s-maxage=21600, stale-while-revalidate=86400",
            },
          });
        }
      } catch {}
    }
  } catch {}

  return Response.redirect(new URL("/top-tier-logo.png", request.url));
}
