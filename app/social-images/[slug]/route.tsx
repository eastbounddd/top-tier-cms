import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";
import { getArticleImage } from "@/lib/articleSocialImage";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("cover_image_url,body")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data) {
    return new Response("Social image not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#0d1013",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getArticleImage(data)}
        alt=""
        width="1200"
        height="675"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>,
    {
      width: 1200,
      height: 675,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
