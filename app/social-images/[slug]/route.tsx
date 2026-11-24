import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@/lib/supabase/server";
import { getArticleImage } from "@/lib/articleSocialImage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("articles").select("cover_image_url,body").eq("slug", slug).eq("status", "published").single();
  if (!data) return new Response("Social image not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  try {
    let png: Buffer;
    const render = (input: Buffer) => sharp(input, { limitInputPixels: 40000000 }).rotate().resize(1200, 675, { fit: "cover" }).png().toBuffer();
    try {
      const response = await fetch(getArticleImage(data), { cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (!response.ok) throw new Error(`Image request failed: ${response.status}`);
      const contentLength = Number(response.headers.get("content-length"));
      if (contentLength > 20 * 1024 * 1024) throw new Error("Image is too large");
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > 20 * 1024 * 1024) throw new Error("Image is too large");
      png = await render(Buffer.from(bytes));
    } catch (error) {
      console.error("Unable to load article social image:", error);
      png = await render(await readFile(path.join(process.cwd(), "public", "top-tier-logo.png")));
    }
    return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Unable to generate article social image:", error);
    return new Response("Social image unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
