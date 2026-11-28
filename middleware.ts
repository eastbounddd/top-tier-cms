import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canonicalWriterSlug, writerPath } from "@/lib/writerPaths";
import { articlePath } from "@/lib/articlePaths";

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/articles/n") {
    const destination = request.nextUrl.clone();
    destination.pathname = articlePath("n");
    return NextResponse.redirect(destination, 301);
  }
  const legacyWriter = request.nextUrl.pathname.match(/^\/(author|writers)\/([^/]+)$/);
  if (legacyWriter) {
    const [, section, slug] = legacyWriter;
    if (section === "author" || canonicalWriterSlug(slug) !== slug) {
      const destination = request.nextUrl.clone();
      // Preserve an already encoded legacy path segment.
      destination.pathname = section === "author" && canonicalWriterSlug(slug) === slug
        ? "/writers/" + slug : writerPath(slug);
      return NextResponse.redirect(destination, 301);
    }
    return NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Cache-Control", "private, no-store");
    return redirect;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/articles/n", "/author/:slug", "/writers/:slug"]
};
