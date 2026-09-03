import { ImageResponse } from "next/og";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("articles")
    .select("cover_image_url")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!data?.cover_image_url) {
    return new Response("Social image not found", { status: 404 });
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
        src={data.cover_image_url}
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
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    }
  );
}
