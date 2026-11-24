import { NextResponse } from "next/server";
import { coverUploadLimit, normalizeArticleCover } from "@/lib/articleCover";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "You are not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const prefix = `${user.id}/cover-originals/`;
  const path = body?.path;
  if (typeof path !== "string" || !path.startsWith(prefix) ||
      !/^[0-9]+-[a-z0-9-]+-[a-z0-9._-]+$/i.test(path.slice(prefix.length))) {
    return NextResponse.json({ error: "Invalid cover image path." }, { status: 400 });
  }

  const bucket = supabase.storage.from("article-images");
  const { data: info, error: infoError } = await bucket.info(path);
  if (infoError) {
    return NextResponse.json({ error: infoError.message }, { status: 400 });
  }
  const tooLarge = () => NextResponse.json({ error: "Choose a cover image under 15 MB." }, { status: 413 });
  if (info.size !== undefined && info.size > coverUploadLimit) return tooLarge();

  const { data: original, error: downloadError } = await bucket.download(path);
  if (downloadError) {
    return NextResponse.json({ error: downloadError.message }, { status: 400 });
  }
  if (original.size > coverUploadLimit) return tooLarge();

  let cropped: Awaited<ReturnType<typeof normalizeArticleCover>>;
  try {
    cropped = await normalizeArticleCover(Buffer.from(await original.arrayBuffer()));
  } catch {
    return NextResponse.json({ error: "This cover could not be processed. Choose a valid JPEG, PNG, or WebP image under 40 megapixels." }, { status: 422 });
  }

  const output = `${user.id}/covers/${crypto.randomUUID()}.webp`;
  const { error: uploadError } = await bucket.upload(output, cropped.bytes, {
    contentType: "image/webp",
    cacheControl: "3600",
    upsert: false,
  });
  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 502 });
  }
  return NextResponse.json({
    url: bucket.getPublicUrl(output).data.publicUrl,
    upscaled: cropped.upscaled,
  });
}
